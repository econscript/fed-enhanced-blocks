/**
 * Fed Enhanced Blocks — editor scripts.
 *
 * Written with the global `wp.*` API so this file works as a plain script
 * with no build step required. For production, you'd typically run this
 * through @wordpress/scripts to get JSX support and proper bundling.
 */
( function ( wp ) {
	if ( ! wp ) {
		return;
	}

	const { registerBlockType }                       = wp.blocks;
	const { createElement: el, Fragment, useEffect, useState }  = wp.element;
	const { __ }                                      = wp.i18n;
	const { InspectorControls, useBlockProps, RichText } = wp.blockEditor || wp.editor;
	const {
		PanelBody,
		TextControl,
		TextareaControl,
		ToggleControl,
		SelectControl,
		Button,
		ColorPicker,
		BaseControl,
	}                                                  = wp.components;
	const { addFilter }                                = wp.hooks;
	const { registerPlugin }                           = wp.plugins;
	const { PluginDocumentSettingPanel }               = wp.editPost || {};
	const { useSelect, useDispatch }                   = wp.data;
	const { createHigherOrderComponent }               = wp.compose;

	/* ----------------------------------------------------------------------
	 * 1) Featured image caption — sidebar panel.
	 * -------------------------------------------------------------------- */
	if ( PluginDocumentSettingPanel ) {
		const FeaturedCaptionPanel = function () {
			const META_KEY = '_feb_featured_image_caption';

			const { caption, featuredId } = useSelect( ( select ) => {
				const editor = select( 'core/editor' );
				return {
					caption:    editor.getEditedPostAttribute( 'meta' )?.[ META_KEY ] || '',
					featuredId: editor.getEditedPostAttribute( 'featured_media' ),
				};
			}, [] );

			const { editPost } = useDispatch( 'core/editor' );

			// Don't render the panel if no featured image is set.
			if ( ! featuredId ) {
				return el(
					PluginDocumentSettingPanel,
					{
						name:  'feb-featured-caption',
						title: __( 'Featured Image Caption', 'fed-enhanced-blocks' ),
					},
					el( 'p', { style: { opacity: 0.7 } }, __( 'Set a featured image first to add a caption.', 'fed-enhanced-blocks' ) )
				);
			}

			return el(
				PluginDocumentSettingPanel,
				{
					name:  'feb-featured-caption',
					title: __( 'Featured Image Caption', 'fed-enhanced-blocks' ),
				},
				el( TextareaControl, {
					label:    __( 'Caption', 'fed-enhanced-blocks' ),
					help:     __( 'Shown beneath the featured image on the front end.', 'fed-enhanced-blocks' ),
					value:    caption,
					onChange: ( value ) => editPost( { meta: { [ META_KEY ]: value } } ),
				} )
			);
		};

		registerPlugin( 'feb-featured-caption', { render: FeaturedCaptionPanel, icon: 'format-image' } );
	}

	/* ----------------------------------------------------------------------
	 * 1b) Featured image caption — INLINE under core/post-featured-image.
	 *
	 * The sidebar panel above is the canonical edit point (works even when
	 * the Featured Image block isn't on the page). This adds a second,
	 * inline editor for sites where the block IS on the page, so editors
	 * can see and edit the caption right under the image.
	 *
	 * Both surfaces read/write the same post meta, so they stay in sync.
	 * -------------------------------------------------------------------- */
	const FEATURED_META_KEY = '_feb_featured_image_caption';

	const withFeaturedImageCaption = createHigherOrderComponent( ( BlockEdit ) => {
		return ( props ) => {
			if ( props.name !== 'core/post-featured-image' ) {
				return el( BlockEdit, props );
			}

			// `core/editor` is only present in the post editor. In the Site Editor
			// (FSE templates), this returns undefined and we should render the
			// block unchanged — the caption is per-post, so there's nothing
			// meaningful to edit on a template.
			const { caption, hasPostContext } = useSelect( ( select ) => {
				const editor = select( 'core/editor' );
				if ( ! editor || ! editor.getEditedPostAttribute ) {
					return { caption: '', hasPostContext: false };
				}
				return {
					caption:         editor.getEditedPostAttribute( 'meta' )?.[ FEATURED_META_KEY ] || '',
					hasPostContext:  true,
				};
			}, [] );

			const { editPost } = useDispatch( 'core/editor' );

			if ( ! hasPostContext ) {
				return el( BlockEdit, props );
			}

			return el(
				Fragment,
				{},
				el( BlockEdit, props ),
				el( 'figcaption', {
					className: 'feb-featured-caption-editor',
					style: {
						fontSize:   '0.875rem',
						color:      '#4b5563',
						fontStyle:  'italic',
						marginTop:  '0.5rem',
						padding:    '0.25rem 0',
					},
				},
					el( RichText, {
						tagName:        'span',
						value:          caption,
						allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ],
						placeholder:    __( 'Write caption…', 'fed-enhanced-blocks' ),
						onChange:       ( value ) => editPost && editPost( { meta: { [ FEATURED_META_KEY ]: value } } ),
					} )
				)
			);
		};
	}, 'withFeaturedImageCaption' );

	addFilter( 'editor.BlockEdit', 'feb/featured-image-caption-inline', withFeaturedImageCaption );

	/* ----------------------------------------------------------------------
	 * 2) Caption attribute on core/media-text.
	 * -------------------------------------------------------------------- */
	addFilter(
		'blocks.registerBlockType',
		'feb/media-text-caption-attr',
		( settings, name ) => {
			if ( name !== 'core/media-text' ) return settings;
			return {
				...settings,
				attributes: {
					...settings.attributes,
					febCaption: { type: 'string', default: '' },
				},
			};
		}
	);

	const withMediaTextCaptionControls = createHigherOrderComponent( ( BlockEdit ) => {
		return ( props ) => {
			if ( props.name !== 'core/media-text' ) {
				return el( BlockEdit, props );
			}
			const { attributes, setAttributes } = props;

			return el(
				Fragment,
				{},
				el( BlockEdit, props ),

				// Inline editable caption shown directly beneath the block.
				// Mirrors what visitors see on the front end.
				el( 'figcaption', {
					className: 'feb-media-text-caption-editor',
					style: {
						fontSize:  '0.875rem',
						color:     '#4b5563',
						fontStyle: 'italic',
						marginTop: '0.25rem',
						padding:   '0.25rem 0',
					},
				},
					el( RichText, {
						tagName:        'span',
						value:          attributes.febCaption || '',
						allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ],
						placeholder:    __( 'Write caption…', 'fed-enhanced-blocks' ),
						onChange:       ( value ) => setAttributes( { febCaption: value } ),
					} )
				),

				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Caption', 'fed-enhanced-blocks' ), initialOpen: false },
						el( TextareaControl, {
							label:    __( 'Media caption', 'fed-enhanced-blocks' ),
							help:     __( 'Also editable inline beneath the block.', 'fed-enhanced-blocks' ),
							value:    attributes.febCaption || '',
							onChange: ( value ) => setAttributes( { febCaption: value } ),
						} )
					)
				)
			);
		};
	}, 'withMediaTextCaptionControls' );

	addFilter( 'editor.BlockEdit', 'feb/media-text-caption-controls', withMediaTextCaptionControls );

	/* ----------------------------------------------------------------------
	 * 3) The feb/data-table block.
	 * -------------------------------------------------------------------- */
	registerBlockType( 'feb/data-table', {
		apiVersion: 2,
		title:      __( 'Data Table (Enhanced)', 'fed-enhanced-blocks' ),
		category:   'design',
		icon:       'editor-table',
		description: __( 'A sortable, styleable, mobile-responsive table for data-driven content. Sorting reorders the saved data in the editor.', 'fed-enhanced-blocks' ),

		edit: ( { attributes, setAttributes } ) => {
			const {
				caption, headers, rows,
				enableSort, enableFilter,
				stripedRows, borderedCells,
				headerBg, headerColor, stripeColor, borderColor,
				mobileMode,
			} = attributes;

			// Editor-only filter query. Lives in component state, never saved.
			const [ filterQuery, setFilterQuery ] = useState( '' );
			const filterNeedle = filterQuery.trim().toLowerCase();
			const rowMatchesFilter = ( row ) => {
				if ( ! filterNeedle ) return true;
				return row.some( ( cell ) => String( cell ).toLowerCase().indexOf( filterNeedle ) !== -1 );
			};

			const updateHeader = ( idx, value ) => {
				const next = headers.slice();
				next[ idx ] = value;
				setAttributes( { headers: next } );
			};

			const updateCell = ( r, c, value ) => {
				const next = rows.map( ( row ) => row.slice() );
				next[ r ][ c ] = value;
				setAttributes( { rows: next } );
			};

			const addColumn = () => {
				setAttributes( {
					headers: [ ...headers, `Column ${ headers.length + 1 }` ],
					rows:    rows.map( ( r ) => [ ...r, '' ] ),
				} );
			};

			const removeColumn = ( idx ) => {
				if ( headers.length <= 1 ) return;
				setAttributes( {
					headers: headers.filter( ( _, i ) => i !== idx ),
					rows:    rows.map( ( r ) => r.filter( ( _, i ) => i !== idx ) ),
				} );
			};

			const addRow = () => {
				setAttributes( { rows: [ ...rows, headers.map( () => '' ) ] } );
			};

			const removeRow = ( idx ) => {
				if ( rows.length <= 1 ) return;
				setAttributes( { rows: rows.filter( ( _, i ) => i !== idx ) } );
			};

			// Track which column is currently sorted and in which direction.
			// Only used to drive the visual indicator and to alternate direction
			// on subsequent clicks. The saved rows are actually reordered.
			const [ sortState, setSortState ] = useState( { index: null, dir: null } );

			// Numeric-aware comparator. Matches the front-end logic so the
			// editor and front-end sort behave identically.
			const isNumeric = ( v ) => {
				if ( v === null || v === undefined || v === '' ) return false;
				const stripped = String( v ).replace( /[\s,%$€£¥]/g, '' );
				return ! isNaN( parseFloat( stripped ) ) && isFinite( stripped );
			};
			const toNumber = ( v ) => parseFloat( String( v ).replace( /[\s,%$€£¥]/g, '' ) );
			const compareCells = ( a, b ) => {
				if ( isNumeric( a ) && isNumeric( b ) ) {
					return toNumber( a ) - toNumber( b );
				}
				return String( a ).localeCompare( String( b ), undefined, { numeric: true, sensitivity: 'base' } );
			};

			const sortByColumn = ( colIndex ) => {
				const sameCol = sortState.index === colIndex;
				const nextDir = sameCol && sortState.dir === 'asc' ? 'desc' : 'asc';

				const sorted = rows.slice().sort( ( a, b ) => {
					const result = compareCells( a[ colIndex ] || '', b[ colIndex ] || '' );
					return nextDir === 'asc' ? result : -result;
				} );

				setAttributes( { rows: sorted } );
				setSortState( { index: colIndex, dir: nextDir } );
			};

			const blockProps = useBlockProps( {
				className: 'feb-data-table-editor',
				style: {
					'--feb-header-bg':     headerBg,
					'--feb-header-color':  headerColor,
					'--feb-stripe-color':  stripeColor,
					'--feb-border-color':  borderColor,
				},
			} );

			return el(
				Fragment,
				{},
				el(
					InspectorControls,
					{},
					el(
						PanelBody,
						{ title: __( 'Behavior', 'fed-enhanced-blocks' ), initialOpen: true },
						el( ToggleControl, {
							label:    __( 'Enable column sorting in editor', 'fed-enhanced-blocks' ),
							help:     __( 'When on, clicking a column header here reorders the saved rows. The front end always renders whatever order was saved.', 'fed-enhanced-blocks' ),
							checked:  enableSort,
							onChange: ( v ) => setAttributes( { enableSort: v } ),
						} ),
						el( ToggleControl, {
							label:    __( 'Enable row filter in editor', 'fed-enhanced-blocks' ),
							help:     __( 'Adds a search box above the table for finding rows while editing. Hides non-matching rows from view; saved data is never changed.', 'fed-enhanced-blocks' ),
							checked:  enableFilter,
							onChange: ( v ) => {
								setAttributes( { enableFilter: v } );
								if ( ! v ) setFilterQuery( '' ); // clear filter when disabled
							},
						} ),
						el( SelectControl, {
							label:   __( 'Mobile layout', 'fed-enhanced-blocks' ),
							value:   mobileMode,
							options: [
								{ label: __( 'Stack rows as cards', 'fed-enhanced-blocks' ), value: 'stack' },
								{ label: __( 'Horizontal scroll', 'fed-enhanced-blocks' ),    value: 'scroll' },
							],
							onChange: ( v ) => setAttributes( { mobileMode: v } ),
						} )
					),
					el(
						PanelBody,
						{ title: __( 'Style', 'fed-enhanced-blocks' ), initialOpen: false },
						el( ToggleControl, {
							label:    __( 'Striped rows', 'fed-enhanced-blocks' ),
							checked:  stripedRows,
							onChange: ( v ) => setAttributes( { stripedRows: v } ),
						} ),
						el( ToggleControl, {
							label:    __( 'Bordered cells', 'fed-enhanced-blocks' ),
							checked:  borderedCells,
							onChange: ( v ) => setAttributes( { borderedCells: v } ),
						} ),
						el( BaseControl, { label: __( 'Header background', 'fed-enhanced-blocks' ) },
							el( ColorPicker, { color: headerBg, onChange: ( v ) => setAttributes( { headerBg: v } ), disableAlpha: true } )
						),
						el( BaseControl, { label: __( 'Header text', 'fed-enhanced-blocks' ) },
							el( ColorPicker, { color: headerColor, onChange: ( v ) => setAttributes( { headerColor: v } ), disableAlpha: true } )
						),
						el( BaseControl, { label: __( 'Stripe color', 'fed-enhanced-blocks' ) },
							el( ColorPicker, { color: stripeColor, onChange: ( v ) => setAttributes( { stripeColor: v } ), disableAlpha: true } )
						),
						el( BaseControl, { label: __( 'Border color', 'fed-enhanced-blocks' ) },
							el( ColorPicker, { color: borderColor, onChange: ( v ) => setAttributes( { borderColor: v } ), disableAlpha: true } )
						)
					)
				),

				el( 'div', blockProps,
					enableFilter
						? el( 'div', { className: 'feb-editor-filter-bar' },
							el( 'input', {
								type:        'search',
								className:   'feb-editor-filter-input',
								value:       filterQuery,
								onChange:    ( e ) => setFilterQuery( e.target.value ),
								placeholder: __( 'Filter rows in editor…', 'fed-enhanced-blocks' ),
								'aria-label': __( 'Filter table rows in editor', 'fed-enhanced-blocks' ),
							} ),
							filterNeedle
								? el( 'span', { className: 'feb-editor-filter-status' },
									__( 'Editor view only — does not affect saved data.', 'fed-enhanced-blocks' )
								)
								: null
						)
						: null,

					el( 'div', { className: 'feb-editor-table-wrap' },
						el( 'table', { className: 'feb-editor-table' },
							el( 'thead', {},
								el( 'tr', {},
									headers.map( ( h, i ) => {
										const isActive = enableSort && sortState.index === i;
										const dir      = isActive ? sortState.dir : null;
										const ariaSort = dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none';
										const sortLabel = dir === 'asc'
											? __( 'Sorted ascending. Click to sort descending.', 'fed-enhanced-blocks' )
											: dir === 'desc'
												? __( 'Sorted descending. Click to sort ascending.', 'fed-enhanced-blocks' )
												: __( 'Click to sort by this column', 'fed-enhanced-blocks' );

										const thProps = {
											key:       i,
											className: isActive ? `is-sorted is-sorted-${ dir }` : '',
										};

										if ( enableSort ) {
											thProps.onClick      = () => sortByColumn( i );
											thProps.onKeyDown    = ( e ) => {
												if ( e.key === 'Enter' || e.key === ' ' ) {
													e.preventDefault();
													sortByColumn( i );
												}
											};
											thProps.tabIndex     = 0;
											thProps.role         = 'button';
											thProps['aria-sort']  = ariaSort;
											thProps['aria-label'] = sortLabel;
											thProps.title         = sortLabel;
											thProps.className    += ' is-sortable';
										}

										// Stop clicks on the input or remove button from bubbling
										// up to the <th> and triggering an unintended sort.
										const stopBubble = ( e ) => e.stopPropagation();

										return el( 'th', thProps,
											el( 'div', { className: 'feb-th-inner' },
												el( 'input', {
													type:         'text',
													value:        h,
													onChange:     ( e ) => updateHeader( i, e.target.value ),
													onClick:      stopBubble,
													onKeyDown:    stopBubble,
													onMouseDown:  stopBubble,
													'aria-label': __( 'Column header', 'fed-enhanced-blocks' ),
												} ),
												enableSort
													? el( 'span', {
														className:    `feb-sort-icon feb-sort-icon-${ dir || 'none' }`,
														'aria-hidden': 'true',
													} )
													: null,
												el( 'span', { onClick: stopBubble, onMouseDown: stopBubble },
													el( Button, {
														isDestructive: true,
														isSmall:       true,
														onClick:       () => removeColumn( i ),
														'aria-label':   __( 'Remove column', 'fed-enhanced-blocks' ),
													}, '×' )
												)
											)
										);
									} )
								)
							),
							el( 'tbody', {},
								rows.map( ( row, r ) => {
									const matches = rowMatchesFilter( row );
									return el( 'tr', {
										key:       r,
										style:     matches ? null : { display: 'none' },
										className: matches ? '' : 'is-filtered-out',
									},
										row.map( ( cell, c ) =>
											el( 'td', { key: c },
												el( 'input', {
													type:     'text',
													value:    cell,
													onChange: ( e ) => updateCell( r, c, e.target.value ),
												} )
											)
										),
										el( 'td', { className: 'feb-row-actions' },
											el( Button, {
												isDestructive: true,
												isSmall:       true,
												onClick:       () => removeRow( r ),
												'aria-label':   __( 'Remove row', 'fed-enhanced-blocks' ),
											}, '×' )
										)
									)
								} )
							)
						)
					),

					el( 'div', { className: 'feb-editor-actions' },
						el( Button, { variant: 'secondary', onClick: addRow }, __( '+ Add row', 'fed-enhanced-blocks' ) ),
						el( Button, { variant: 'secondary', onClick: addColumn }, __( '+ Add column', 'fed-enhanced-blocks' ) )
					),

					// Inline editable caption shown below the table, matching
					// the front-end rendering position.
					el( 'div', {
						className: 'feb-data-table-caption-editor',
					},
						el( RichText, {
							tagName:        'span',
							value:          caption,
							allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ],
							placeholder:    __( 'Add a table caption (e.g., Quarterly inflation by region, 2025)…', 'fed-enhanced-blocks' ),
							onChange:       ( v ) => setAttributes( { caption: v } ),
						} )
					)
				)
			);
		},

		// Dynamic block — markup is produced by PHP render_callback.
		save: () => null,
	} );

} )( window.wp );
