/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */
qx.Theme.define("dockable.theme.Decoration",
{
    extend : qx.theme.modern.Decoration,
    decorations : {

        "dockwindow" :
        {
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

        "dockwindow-pane" :
        {
            include : "window-pane",
            style :
            {
                backgroundColor : "background-pane",
                width : 0,
                color : "window-border",
                widthTop : 0
            }
        },

        "dockwindow-captionbar-active" :
        {
            include : "window-captionbar-active",
            style : {
                width : 0,
                color : "window-border",
                colorBottom : "window-border-caption",
                radius : [0, 0, 0, 0],
                gradientStart : ["window-caption-active-start", 30],
                gradientEnd : ["window-caption-active-end", 70]
            }
        },

        "dockwindow-captionbar-inactive" :
        {
            include : "dockwindow-captionbar-active",
            style : {
                gradientStart : ["window-caption-inactive-start", 30],
                gradientEnd : ["window-caption-inactive-end", 70]
            }
        }


    }
});
