<?php
/**
 * Registers the feb/data-table block: a sortable, filterable, responsive table block.
 *
 * @package FedEnhancedBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FEB_Data_Table_Block {

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_block' ) );
	}

	/**
	 * Register the block. We use block.json for metadata and a PHP render callback
	 * so we can output progressive-enhancement-friendly markup.
	 */
	public static function register_block() {
		register_block_type(
			'feb/data-table',
			array(
				'api_version'     => 2,
				'title'           => __( 'Data Table (Enhanced)', 'fed-enhanced-blocks' ),
				'category'        => 'design',
				'icon'            => 'editor-table',
				'description'     => __( 'A responsive, sortable, filterable table for data-driven content.', 'fed-enhanced-blocks' ),
				'keywords'        => array( 'table', 'data', 'sort', 'filter', 'chart' ),
				'supports'        => array(
					'html'  => false,
					'align' => array( 'wide', 'full' ),
				),
				'attributes'      => array(
					'caption'        => array( 'type' => 'string', 'default' => '' ),
					'headers'        => array( 'type' => 'array',  'default' => array( 'Column 1', 'Column 2', 'Column 3' ) ),
					'rows'           => array( 'type' => 'array',  'default' => array( array( '', '', '' ) ) ),
					'enableSort'     => array( 'type' => 'boolean', 'default' => true ),  // Editor-only: click header to reorder saved rows.
					'enableFilter'   => array( 'type' => 'boolean', 'default' => true ),  // Editor-only: hides rows in editor while typing in a filter box. Saved data unchanged.
					'stripedRows'    => array( 'type' => 'boolean', 'default' => true ),
					'borderedCells'  => array( 'type' => 'boolean', 'default' => true ),
					'headerBg'       => array( 'type' => 'string',  'default' => '#0a3161' ),
					'headerColor'    => array( 'type' => 'string',  'default' => '#ffffff' ),
					'stripeColor'    => array( 'type' => 'string',  'default' => '#f5f7fa' ),
					'borderColor'    => array( 'type' => 'string',  'default' => '#d1d5db' ),
					'mobileMode'     => array( 'type' => 'string',  'default' => 'stack' ), // 'stack' | 'scroll'.
				),
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * Server-side render. Produces semantic <table> markup that the front-end
	 * JS progressively enhances (sort/filter).
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public static function render( $attributes ) {
		$caption       = isset( $attributes['caption'] ) ? wp_kses_post( $attributes['caption'] ) : '';
		$headers       = isset( $attributes['headers'] ) && is_array( $attributes['headers'] ) ? $attributes['headers'] : array();
		$rows          = isset( $attributes['rows'] ) && is_array( $attributes['rows'] ) ? $attributes['rows'] : array();
		$striped       = ! empty( $attributes['stripedRows'] );
		$bordered      = ! empty( $attributes['borderedCells'] );
		$mobile_mode   = isset( $attributes['mobileMode'] ) && in_array( $attributes['mobileMode'], array( 'stack', 'scroll' ), true ) ? $attributes['mobileMode'] : 'stack';

		$header_bg     = self::sanitize_hex( $attributes['headerBg'] ?? '#0a3161' );
		$header_color  = self::sanitize_hex( $attributes['headerColor'] ?? '#ffffff' );
		$stripe_color  = self::sanitize_hex( $attributes['stripeColor'] ?? '#f5f7fa' );
		$border_color  = self::sanitize_hex( $attributes['borderColor'] ?? '#d1d5db' );

		$classes = array( 'feb-data-table' );
		if ( $striped )  { $classes[] = 'is-striped'; }
		if ( $bordered ) { $classes[] = 'is-bordered'; }
		$classes[] = 'mobile-' . $mobile_mode;

		$style = sprintf(
			'--feb-header-bg:%s;--feb-header-color:%s;--feb-stripe-color:%s;--feb-border-color:%s;',
			esc_attr( $header_bg ),
			esc_attr( $header_color ),
			esc_attr( $stripe_color ),
			esc_attr( $border_color )
		);

		ob_start();
		?>
		<div class="feb-data-table-wrap" style="<?php echo esc_attr( $style ); ?>">
			<div class="feb-data-table-scroll">
				<table class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>">
					<?php if ( $caption ) : ?>
						<caption class="feb-data-table-caption"><?php echo $caption; // already wp_kses_post. ?></caption>
					<?php endif; ?>
					<thead>
						<tr>
							<?php foreach ( $headers as $header ) : ?>
								<th scope="col"><?php echo esc_html( $header ); ?></th>
							<?php endforeach; ?>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $rows as $row ) : ?>
							<tr>
								<?php foreach ( (array) $row as $i => $cell ) : ?>
									<td data-label="<?php echo esc_attr( $headers[ $i ] ?? '' ); ?>"><?php echo esc_html( $cell ); ?></td>
								<?php endforeach; ?>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}

	/**
	 * Validate a hex color, falling back to a safe default.
	 *
	 * @param string $color
	 * @return string
	 */
	protected static function sanitize_hex( $color ) {
		$color = is_string( $color ) ? trim( $color ) : '';
		if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}$/', $color ) ) {
			return $color;
		}
		return '#000000';
	}
}
