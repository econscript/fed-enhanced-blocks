<?php
/**
 * Featured image caption support.
 *
 * Registers a post-meta field that stores a caption to display alongside the featured image,
 * and filters the_post_thumbnail markup on the front end to wrap it with a <figcaption>.
 *
 * @package FedEnhancedBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FEB_Featured_Image_Caption {

	const META_KEY = '_feb_featured_image_caption';

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_meta' ) );
		add_filter( 'post_thumbnail_html', array( __CLASS__, 'wrap_thumbnail_with_caption' ), 10, 5 );
	}

	/**
	 * Register the meta so it is exposed to the REST API / block editor.
	 *
	 * We register it per supported post type so the sidebar control only shows where it makes sense.
	 */
	public static function register_meta() {
		$post_types = apply_filters( 'feb_featured_caption_post_types', array( 'post', 'page' ) );

		foreach ( $post_types as $post_type ) {
			register_post_meta(
				$post_type,
				self::META_KEY,
				array(
					'type'              => 'string',
					'description'       => __( 'Caption shown beneath the featured image.', 'fed-enhanced-blocks' ),
					'single'            => true,
					'show_in_rest'      => true,
					'default'           => '',
					'sanitize_callback' => 'wp_kses_post',
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}

	/**
	 * Wrap the featured image with a <figure>/<figcaption> when a caption is set.
	 *
	 * @param string $html              The post thumbnail HTML.
	 * @param int    $post_id           The post ID.
	 * @param int    $post_thumbnail_id The post thumbnail ID.
	 * @param string|array $size        The image size.
	 * @param array  $attr              Query string of attributes.
	 * @return string
	 */
	public static function wrap_thumbnail_with_caption( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
		if ( empty( $html ) ) {
			return $html;
		}

		$caption = get_post_meta( $post_id, self::META_KEY, true );
		if ( empty( $caption ) ) {
			return $html;
		}

		$caption_html = wp_kses_post( $caption );

		return sprintf(
			'<figure class="feb-featured-figure">%s<figcaption class="feb-featured-caption">%s</figcaption></figure>',
			$html,
			$caption_html
		);
	}
}
