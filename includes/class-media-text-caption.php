<?php
/**
 * Adds caption support to core/media-text via render_block filter.
 *
 * The block attribute itself is added in JS (block-edit filter) because attributes
 * must be registered on the JS side for the editor UI to read/write them.
 * Here we just handle render-time output if the saved markup didn't already include it,
 * and act as a safety net for older content.
 *
 * @package FedEnhancedBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FEB_Media_Text_Caption {

	public static function init() {
		add_filter( 'render_block_core/media-text', array( __CLASS__, 'maybe_inject_caption' ), 10, 2 );
	}

	/**
	 * If the block has a febCaption attribute, append a <figcaption>-like element
	 * inside the media column on render.
	 *
	 * @param string $block_content Block HTML.
	 * @param array  $block         Parsed block.
	 * @return string
	 */
	public static function maybe_inject_caption( $block_content, $block ) {
		if ( empty( $block['attrs']['febCaption'] ) ) {
			return $block_content;
		}

		$caption = wp_kses_post( $block['attrs']['febCaption'] );

		// Inject inside the media column wrapper. Core class is .wp-block-media-text__media.
		// Use preg_replace_callback so the user-supplied caption can't be interpreted as
		// a backreference (e.g. "$1" in the caption text).
		$figure_pattern = '/(<figure class="wp-block-media-text__media"[^>]*>)(.*?)(<\/figure>)/s';
		$injected       = preg_replace_callback(
			$figure_pattern,
			function ( $matches ) use ( $caption ) {
				return $matches[1] . $matches[2] . '<figcaption class="feb-media-text-caption">' . $caption . '</figcaption>' . $matches[3];
			},
			$block_content,
			1,
			$count
		);

		// Fallback for <div> wrappers (older / filtered markup).
		if ( ! $count ) {
			$div_pattern = '/(<(?:div|figure) class="wp-block-media-text__media"[^>]*>)(.*?)(<\/(?:div|figure)>)/s';
			$injected    = preg_replace_callback(
				$div_pattern,
				function ( $matches ) use ( $caption ) {
					return $matches[1] . $matches[2] . '<span class="feb-media-text-caption">' . $caption . '</span>' . $matches[3];
				},
				$block_content,
				1
			);
		}

		return $injected ? $injected : $block_content;
	}
}
