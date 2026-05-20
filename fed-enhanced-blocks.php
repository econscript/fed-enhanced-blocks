<?php
/**
 * Plugin Name:       Fed Enhanced Blocks
 * Plugin URI:        https://example.org/fed-enhanced-blocks
 * Description:       Adds caption support to featured images and Media & Text blocks, and provides an enhanced data table block with sorting, filtering, advanced styling, and mobile responsiveness.
 * Version:           1.0.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Your Team
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       fed-enhanced-blocks
 * Domain Path:       /languages
 *
 * @package FedEnhancedBlocks
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'FEB_VERSION', '1.0.0' );
define( 'FEB_PLUGIN_FILE', __FILE__ );
define( 'FEB_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FEB_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Load feature modules.
require_once FEB_PLUGIN_DIR . 'includes/class-featured-image-caption.php';
require_once FEB_PLUGIN_DIR . 'includes/class-media-text-caption.php';
require_once FEB_PLUGIN_DIR . 'includes/class-data-table-block.php';

/**
 * Bootstrap the plugin.
 */
function feb_bootstrap() {
	load_plugin_textdomain( 'fed-enhanced-blocks', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

	FEB_Featured_Image_Caption::init();
	FEB_Media_Text_Caption::init();
	FEB_Data_Table_Block::init();
}
add_action( 'plugins_loaded', 'feb_bootstrap' );

/**
 * Enqueue editor-side assets (block editor screen).
 */
function feb_enqueue_editor_assets() {
	wp_enqueue_script(
		'feb-editor',
		FEB_PLUGIN_URL . 'assets/js/editor.js',
		array( 'wp-blocks', 'wp-element', 'wp-edit-post', 'wp-components', 'wp-data', 'wp-compose', 'wp-hooks', 'wp-i18n', 'wp-block-editor', 'wp-plugins' ),
		FEB_VERSION,
		true
	);

	wp_enqueue_style(
		'feb-editor',
		FEB_PLUGIN_URL . 'assets/css/editor.css',
		array(),
		FEB_VERSION
	);

	wp_set_script_translations( 'feb-editor', 'fed-enhanced-blocks' );
}
add_action( 'enqueue_block_editor_assets', 'feb_enqueue_editor_assets' );

/**
 * Enqueue front-end CSS only — there is no front-end JS. All interactivity
 * (sort, filter) lives in the block editor; the front end renders plain
 * semantic HTML.
 */
function feb_enqueue_frontend_assets() {
	wp_enqueue_style(
		'feb-frontend',
		FEB_PLUGIN_URL . 'assets/css/frontend.css',
		array(),
		FEB_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'feb_enqueue_frontend_assets' );
