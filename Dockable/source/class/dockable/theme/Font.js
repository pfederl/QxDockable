/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */
qx.Theme.define("dockable.theme.Font",
{
    extend : qx.theme.modern.Font,
    fonts : {

        "dockWinTitle" :
        {
            size : (qx.core.Environment.get("os.name") == "win" &&
                (qx.core.Environment.get("os.version") == "7" ||
                    qx.core.Environment.get("os.version") == "vista")) ? 11 : 10,
            lineHeight : 1.4,
            family : qx.core.Environment.get("os.name") == "osx" ?
                [ "Lucida Grande" ] :
                ((qx.core.Environment.get("os.name") == "win" &&
                    (qx.core.Environment.get("os.version") == "7" ||
                        qx.core.Environment.get("os.version") == "vista"))) ?
                    [ "Segoe UI", "Candara" ] :
                    [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ],
            bold : false
        }

    }
});
