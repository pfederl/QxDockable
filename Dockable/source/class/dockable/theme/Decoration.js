/* ************************************************************************

 Copyright:

 License:

 Authors:

 ************************************************************************ */
qx.Theme.define("dockable.theme.Decoration", {

    extend : qx.theme.modern.Decoration,
    decorations : {

        "dockwindow" : {
            include : "window",
            style : {
                radius : [0, 0, 0, 0],
                shadowBlurRadius : 0,
                shadowLength : 0,
                shadowColor : "shadow"
            }
        },

        "dockwindow-incl-statusbar" : {
            include : "dockwindow",
            style : {
                radius : [0, 0, 0, 0]
            }
        },

        "dockwindow-pane" : {
            include : "window-pane",
            style : {
                backgroundColor : "background-pane",
                width : 1,
                widthBottom : 1,
                color : "dockwindow-border",
                widthTop : 0
            }
        },

        "dockwindow-captionbar-active" : {
            include : "window-captionbar-active",
            style : {
                width : 1,
                color : "dockwindow-border",
                colorBottom : null,
                radius : [0, 0, 0, 0],
                gradientStart : ["window-caption-active-start", 30],
                gradientEnd : ["window-caption-active-end", 70]
            }
        },

        "dockwindow-captionbar-inactive" : {
            include : "dockwindow-captionbar-active",
            style : {
                gradientStart : ["window-caption-inactive-start", 30],
                gradientEnd : ["window-caption-inactive-end", 70]
            }
        },

        "dock-area" : {
            style : {
                backgroundColor : "rgb(255,255,0)",
                radius : 10
            }
        },

        "dock-area-highlighted" : {
            include : "dock-area",
            style : {
                color : "rgb(0,0,0)",
                width: 3,
                style : "dotted"
            }
        }


    }
});
