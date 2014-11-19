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
            main : function ()
            {
                // Call super class
                this.base(arguments);

                // Enable logging in debug variant
                if ( qx.core.Environment.get("qx.debug") ) {
                    // support native logging capabilities, e.g. Firebug for Firefox
                    qx.log.appender.Native;
                }

                // Document is the application root
                var root = this.getRoot();
                var mainDock = new dockable.Desktop();

                //            var layout = new dockable.DockLayout({
                //                type : "grid",
                //                rows : [1,2],
                //                columns : [2, 1]
                //            });

                var layout = new dockable.DockLayout({
                    type : "grid",
                    rows : [2, 1, 0.5],
                    columns : [2, 1, 1, 1]
                });

                layout.setKidLayout(0, 2, new dockable.DockLayout({
                    rows : [1, 1], columns : [1, 2]
                }));

                layout.setKidLayout(1, 0, new dockable.DockLayout({
                    rows : [1], columns : [1, 1, 1]
                }));

                var subl = new dockable.DockLayout({ rows : [1,1]});
                subl.setKidLayout( 1, 0, new dockable.DockLayout({ columns: [ 1, 1] }));
                layout.setKidLayout( 0, 3, subl);

                mainDock.setDockLayout(layout);
                mainDock.setMarginLeft( 100);

                var topBar = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));
                topBar.setBackgroundColor("#ff0000");
                topBar.setPadding(5);
                topBar.getLayout().setAlignY("middle");
                root.add(topBar, { left : 0, top : 0, right : 0});

                root.add(mainDock,
                    {
                        edge : 5,
                        left : 50,
                        top : 50
                    });

                // Add button to document at fixed coordinates
                var button1 = new qx.ui.form.Button("Make free window");
                topBar.add(button1);
                var winNumber = 1;
                button1.addListener("execute", function ( e )
                {
                    var win = new dockable.Window("win1");
                    win.setMinHeight(10);
                    win.setLayout(new qx.ui.layout.Canvas());
                    win.setCaption("Window " + winNumber);
                    win.add(new qx.ui.form.TextField(), { edge : 5 });
                    winNumber++;
                    mainDock.add(win);
                    win.open();
                });

                var button2 = new qx.ui.form.Button("Make docked window");
                topBar.add(button2);
                button2.addListener("execute", function ( e )
                {
                    mainDock.dockLayout().forEachLayout(function ( layout )
                    {
                        if ( !layout.isLeafNode() ) return;
                        if ( layout.isOccupied() ) return;

                        var win = new dockable.Window("win1");
                        win.setMinHeight(10);
                        win.setLayout(new qx.ui.layout.Canvas());
                        win.setCaption("Window " + winNumber);
                        win.add(new qx.ui.form.TextField(), { edge : 5 });
                        winNumber++;
                        mainDock.add(win);
                        win.open();

                        win.setDockLayout(layout);
                        layout.setTenant(win);
                    }.bind(this));
                    mainDock._updateUnderlay();
                    mainDock.getWindowManager().updateStack();
                });

                topBar.add(new qx.ui.form.TextField());

                topBar.add(new qx.ui.form.Slider().set({width : 200}));

                root.addListener("keydown", function ( e )
                {
                    console.log("global keydown", e.getKeyCode(), e.getKeyIdentifier());
                }, this, true);
                root.addListener("keydown", function ( e )
                {
                    console.log("bglobal keydown", e.getKeyCode(), e.getKeyIdentifier());
                }, this, false);

            }
        }
    });
