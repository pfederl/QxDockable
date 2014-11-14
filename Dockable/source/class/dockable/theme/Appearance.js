/* ************************************************************************

 Copyright:

 License:

 Authors:

 ************************************************************************ */
qx.Theme.define("dockable.theme.Appearance", {
    extend : qx.theme.modern.Appearance,
    appearances : {

        dockwindow : {
            include : "window",
            alias : "window",

            style : function ( states )
            {
                return {
                    decorator : states.showStatusbar ? "dockwindow-incl-statusbar" :
                        "dockwindow",
                    contentPadding : [10, 10, 10, 10],
                    margin : states.maximized ? 0 : [0, 5, 5, 0]
                };
            }

        },

        "dockwindow/pane" : {
            style : function ( states )
            {
                return {
                    decorator : "dockwindow-pane"
                };
            }
        },

        "dockwindow/captionbar" : {
            style : function ( states )
            {
                return {
                    decorator : (states.active ? "dockwindow-captionbar-active" :
                        "dockwindow-captionbar-inactive"),
                    textColor : states.active ? "window-caption-active-text" : "text-gray",
                    minHeight : 20,
                    paddingRight : 2
                    //                    paddingRight : 0

                };
            }
        },

        "dockwindow/title" : {
            include : "window/title",
            alias : "window/title",
            style : function ( states )
            {
                return {
                    font : "dockWinTitle"
                };
            }
        },

        "dockwindow/maximize-button" : {
            include : "window/maximize-button",

            style : function ( states )
            {
                return {
                    margin : [2, 2, 2, 2]
                };
            }
        },

        "dockwindow/close-button" : {
            include : "window/close-button",

            style : function ( states )
            {
                return {
                    margin : [2, 2, 2, 2]
                };
            }
        },

        "dockwindow/minimize-button" : {
            include : "window/minimize-button",

            style : function ( states )
            {
                return {
                    margin : [2, 2, 2, 2]
                };
            }
        },

        "dockwindow/restore-button" : {
            include : "window/restore-button",

            style : function ( states )
            {
                return {
                    margin : [2, 2, 2, 2]
                };
            }
        },

        "dock-splitter" : {
            include : "widget",

            style : function ( states )
            {
                if ( !states.dragging ) {
                    return {
                        backgroundColor : states.hovered ? "rgba(0,128,0,0.2)" : "rgba(0,128,0,0.1)"
                    }
                }
                else {
                    return {
                        backgroundColor : "rgba(255,0,0,0.5)"
                    }
                }
            }
        },

        "dock-area" : {
            include : "widget",

            style : function ( states )
            {
                return {
//                    decorator : "dock-area"
                    decorator : states.highlighted ? "dock-area-highlighted" : "dock-area"
                }
            }
        }



    }
});
