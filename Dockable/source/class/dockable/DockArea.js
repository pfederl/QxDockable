/**
 * The DockArea is the widget that is shown to indicate available docking area.
 * It is also a placeholder for menus for selecting a layout...
 */

qx.Class.define("dockable.DockArea", {

    extend : qx.ui.container.Composite,

    /*
     *****************************************************************************
     CONSTRUCTOR
     *****************************************************************************
     */

    /**
     * @param desktop {dockable.Desktop} The parent desktop.
     */
    construct : function ()
    {
        this.base(arguments, new qx.ui.layout.Canvas());
        this.setZIndex(11);

        this.addListener("pointerover", this._onPointerOver, this);
        this.addListener("pointerout", this._onPointerOut, this);

        this.setContextMenu(this._makeContextMenu());

    },

    // events
    events : {
        removeMenu : "qx.event.type.Data"
    },

    /*
     *****************************************************************************
     PROPERTIES
     *****************************************************************************
     */

    properties : {

        // overrridden
        allowShrinkX : {
            refine : true,
            init : false
        },

        // overrridden
        allowShrinkY : {
            refine : true,
            init : false
        },

        // overrridden
        appearance : {
            refine : true,
            init : "dock-area"
        },

        highlighted : {
            init : false,
            check : "Boolean",
            apply : "_applyHighlighted"
        }
    },

    /*
     *****************************************************************************
     MEMBERS
     *****************************************************************************
     */

    members : {

        _applyHighlighted : function ( value )
        {
            if ( value ) {
                this.addState("highlighted");
            }
            else {
                this.removeState("highlighted");
            }
        },

        _onPointerOver : function ( ev )
        {
            //            console.log( "das pointer over");
            this.addState("hovered");
        },

        _onPointerOut : function ( /*ev*/ )
        {
            this.removeState("hovered");
        },

        /**
         * Return relative mouse/pointer position wrt. to parent widget
         * @param ev {Event} event to be translated
         * @returns {{x: number, y: number}} the relative position
         * @protected
         */
        _getRelativePointer : function ( ev )
        {
            var parent = this.getLayoutParent().getContentLocation();
            return {
                x : ev.getDocumentLeft() - parent.left,
                y : ev.getDocumentTop() - parent.top
            };
        },

        _makeContextMenu : function ()
        {
            var menu = new qx.ui.menu.Menu();

            var removeButton = new qx.ui.menu.Button("Remove");
            var copyButton = new qx.ui.menu.Button("Duplicate");
            var pasteButton = new qx.ui.menu.Button("Split here");

            menu.add(removeButton);
            menu.add(copyButton);
            menu.add(pasteButton);

            removeButton.addListener("execute", function ()
            {
                this.fireDataEvent("removeMenu", { splitter : this, pos : this._center });
            }, this);

            return menu;
        },

        _getPopup : function ()
        {
            if ( this._popup == null ) {
                this._popup = new qx.ui.popup.Popup(new qx.ui.layout.VBox(1));
            }
        }

    }
});