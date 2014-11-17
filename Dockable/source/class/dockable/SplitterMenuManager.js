/**
 * Since only one context menu will be active at a time, this will keep an instance to
 * a single copy of it.
 *
 * @asset(dockable/*)
 */

qx.Class.define("dockable.SplitterMenuManager", {

    type : "singleton",
    extend : qx.core.Object,

    construct : function ()
    {
        this.base(arguments);
        this._menu = new qx.ui.menu.Menu();

        this._buttons = {};

        this._buttons.remove = new qx.ui.menu.Button("Remove");
        this._menu.add(this._buttons.remove);
        this._buttons.remove.addListener( "execute", this._buttonCB.bind(this, "remove"));

        this._buttons.swap = new qx.ui.menu.Button("Swap");
        this._menu.add(this._buttons.swap);
        this._buttons.swap.addListener( "execute", this._buttonCB.bind(this, "swap"));

        this._buttons.insert = new qx.ui.menu.Button("Insert");
        this._menu.add(this._buttons.insert);
        this._buttons.insert.addListener( "execute", this._buttonCB.bind(this, "insert"));

        this._buttons.split = new qx.ui.menu.Button("Split");
        this._menu.add(this._buttons.split);
        this._buttons.split.addListener( "execute", this._buttonCB.bind(this, "split"));

        this._menu.addListener( "disappear", this._menuDisappearCB, this);
    },

    properties : {
    },

    members : {

        setOrientation : function ( orientation )
        {
            if ( this._orientation === orientation ) return;
            this._orientation = orientation;
            if ( this._orientation === "horizontal" ) {
                this._buttons.remove.setIcon("dockable/deleteHorizontal16.png");
                this._buttons.swap.setIcon("dockable/swapUpDown16.png");
                this._buttons.insert.setIcon("dockable/insertAbove16.png");
                this._buttons.split.setIcon("dockable/splitHorizontal16.png");
            }
            else {
                this._buttons.remove.setIcon("dockable/deleteVertical16.png");
                this._buttons.swap.setIcon("dockable/swapLeftRight16.png");
                this._buttons.insert.setIcon("dockable/insertLeft16.png");
                this._buttons.split.setIcon("dockable/splitVertical16.png");
            }
        },

        /**
         * Gets a pointer to a menu with the given configuration
         * @param config
         */
        showMenuAtPointer : function ( e, config, cb)
        {
            if( config.hasOwnProperty( "orientation")) {
                this.setOrientation( config.orientation);
            }
            this._menu.openAtPointer( e);
            this._callback = cb;
        },

        _menuDisappearCB : function() {

        },

        _buttonCB : function( action) {
            this._callback( action);
        }
    }
});
