/**
 * Custom qx.ui.window.IWindowManager.
 *
 * We need a custom one because:
 * a) we want docked windows to stay below all other windows
 * b) we want the manager to also take care of the z-indices of the resize widgets
 *    so that they stay above docked windows, but below all other windows.
 */

qx.Class.define("dockable.WindowManager", {

    extend : qx.ui.window.Manager,

//    include : [ qx.core.MAssert, qx.core.MLogging ],

    construct : function ()
    {
        this.base(arguments);
        this._overlays = {
            aboveDock : [],
            aboveNormal: [],
            aboveStayOnTop: [],
            aboveModal: []
        };
    },

    members : {

        /**
         * Overridden to account for dockable windows and extra overlays.
         */
        syncWidget : function ()
        {
            this.debug( "d updating stack");

            this.__desktop.forceUnblock();
            var windows = this.__desktop.getWindows();

            // z-index for all three window kinds
            var zIndexDocked = this._minZIndex;
            var zIndexRegular = zIndexDocked + windows.length * 2 + this._overlays.aboveDock.length;
            var zIndexOnTop = zIndexRegular + windows.length * 2;
            var zIndexModal = zIndexOnTop + windows.length * 2;

            // marker if there is an active window
            var active = null;
            for ( var i = 0, l = windows.length ; i < l ; i++ ) {
                var win = windows[i];

                // ignore invisible windows
                if ( !win.isVisible() ) {
                    continue;
                }
                // take the first window as active window
                active = active || win;
                // We use only every second z index to easily insert a blocker between
                // two windows
                // Modal Windows stays on top of AlwaysOnTop Windows, which stays on
                // top of Normal Windows, which stay on top of docked windows.
                if ( win.isModal() ) {
                    win.setZIndex(zIndexModal);
                    this.__desktop.blockContent(zIndexModal - 1);
                    zIndexModal += 2;
                    //just activate it if it's modal
                    active = win;
                }
                else if ( win.isAlwaysOnTop() ) {
                    win.setZIndex(zIndexOnTop);
                    zIndexOnTop += 2;
                }
                else if ( win.isDocked() && !win.isMaximized() ) {
                    win.setZIndex(zIndexDocked);
                    zIndexDocked += 2;
                }
                else {
                    win.setZIndex(zIndexRegular);
                    zIndexRegular += 2;
                }
                // store the active window
                if ( !active.isModal() && win.isActive() || win.getZIndex() > active.getZIndex() ) {
                    active = win;
                }
            }

            // also update z_index of the overlay widgets
            this._overlays.aboveDock.forEach( function(w) {
                w.setZIndex( zIndexDocked);
                zIndexDocked ++;
            });

            //set active window or null otherwise
            this.__desktop.setActiveWindow(active);
        },

        addToOverlay : function ( widget, overlay )
        {
            this.assert( this._overlays[overlay] != null);
            this._overlays[overlay].push( widget);
            this.updateStack();
        },

        _overlays : null
    }

});
