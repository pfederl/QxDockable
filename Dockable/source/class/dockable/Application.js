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
                rows : 2,
                rowSizes : [1,2],
                cols : 4,
                colSizes : [2, 1, 1, 1]
            });

            layout.setKidLayout( 0, 2, new dockable.DockLayout({
                rows: 2, cols: 2, rowSizes: [ 1, 1], colSizes: [1,2]
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
                edge: 0,
                left : 50,
                top : 100
//                right : 200,
//                bottom : 5
            });
            mainDock.getContentElement().setStyle("background", "pink");

            // Add button to document at fixed coordinates
            var button1 = new qx.ui.form.Button("First Button", "dockable/test.png");
            mainDock.add(button1,
            {
                left : 100,
                top : 50
            });

            // Add an event listener
            button1.addListener("execute", function(e)
            {
                var win = new dockable.Window("win1");
                mainDock.addd(win);
                win.open();
            });
            window.mainDock = mainDock;
        }
    }
});
