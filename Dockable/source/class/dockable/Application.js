/* ************************************************************************

 Copyright:

 License:

 Authors:

 ************************************************************************ */

/**
 * This is the main application class of your custom application "Dockable"
 *
 * @asset(dockable/*)
 */
qx.Class.define("dockable.Application",
{
    extend : qx.application.Standalone,

    /*
     *****************************************************************************
     MEMBERS
     *****************************************************************************
     */
    members : {
        /**
         * This method contains the initial application code and gets called
         * during startup of the application
         *
         * @lint ignoreDeprecated(alert)
         */
        main : function()
        {
            // Call super class
            this.base(arguments);

            // Enable logging in debug variant
            if (qx.core.Environment.get("qx.debug")) {
                // support native logging capabilities, e.g. Firebug for Firefox
                qx.log.appender.Native;
            }

            // Document is the application root
            var doc = this.getRoot();
            var mainDock = new dockable.Desktop();

            var layout = new dockable.DockLayout({
                type : "grid",
                rows : [1,2],
                columns : [2, 1, 1, 1]
//                rows : 2,
//                rowSizes : [1,2],
//                cols : 4,
//                colSizes : [2, 1, 1, 1]
            });

            layout.setKidLayout( 0, 2, new dockable.DockLayout({
                rows: [1,1], columns: [1,2]
            }));


//            mainDock.setDockLayout(
//            {
//                type : "grid",
//                rows : 3,
//                cols : 4,
//                colSizes : [2, 1, 1, 1],
//                rowSizes : [1, 2, 1],
//                kids : [null, null, null, null, null, null, null, null, null, null,
//                    {
//                    rows: 2, cols: 2, rowSizes: [ 1, 1], colSizes: [1,1],
//                    kids:[ null,null,null,null]
//                }, null, null, null]
//            });

            mainDock.setDockLayout( layout);


            doc.add(mainDock,
            {
                edge: 5,
                left : 50,
                top : 50
//                right : 200,
//                bottom : 5
            });
//            mainDock.getContentElement().setStyle("background", "pink");

            // Add button to document at fixed coordinates
            var button1 = new qx.ui.form.Button("Make window", "dockable/test.png");
            doc.add(button1,
            {
                left : 5,
                top : 5
            });

            // Add an event listener
            var winNumber = 1;
            button1.addListener("execute", function(e)
            {
                var win = new dockable.Window("win1");
                win.setCaption( "Window " + winNumber);
                winNumber ++;
                mainDock.addd(win);
                win.open();
            });
            window.mainDock = mainDock;
        }
    }
});
