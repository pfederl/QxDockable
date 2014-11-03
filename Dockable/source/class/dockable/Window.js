qx.Class.define('dockable.Window',
    {
        extend : qx.ui.window.Window,

        /**
         * constructor
         */
        construct : function ()
        {
            this.base(arguments);
            this.setUseMoveFrame(false);
            this.m_movingDoneDeferred = null;
            this.m_animationFrame = new qx.bom.AnimationFrame();
            this.m_animationFrame.on("end", this._animationEndCB.bind(this));
            ;
            this.m_animationFrame.on("frame", this._animationFrameCB.bind(this));

            this.m_movingDoneDeferred = new qx.util.DeferredCall(
                this.fireEvent.bind(this, "movingDone"));
            this.DEFAULT_ANIMATION_DURATION = 150;

        },

        /**
         * events
         */
        events : {
            /**
             * Emitted while user is dragging the window around
             */
            moving : "qx.event.type.Data",
            /**
             * Emitted when user is done dragging the window
             */
            movingDone : "qx.event.type.Event",
            /**
             * Emitted when user is starting to drag the window
             */
            movingStart : "qx.event.type.Event"

        },

        properties : {

            // overridden
            appearance : {
                refine : true,
                init : "window"
            }

        },

        /**
         * members
         */
        members : {

            _animationEndCB : function ()
            {
                var rect = this.m_desiredPositionRect;
                if ( rect == null ) return;
                this.moveTo(rect.left, rect.top);
                this.setWidth(rect.width);
                this.setHeight(rect.height);
                console.log("anim count=", this.m_animCount);
            },
            _animationFrameCB : function ( timePassed )
            {
                var r2 = this.m_desiredPositionRect;
                if ( r2 == null ) return;
                var r1 = this.m_startingPositionRect;
                if ( r1 == null ) return;
                var t = 1 - timePassed / this.m_animationDuration;
                t = t * t;
                //            t = Math.sqrt(t);

                //            var v = t-1;
                //            var p = 0.3;
                //            t = -Math.pow(2, 10 * v) * Math.sin( (v - p / 4) * 2 * Math.PI / p );

                var rect = {
                    left : r1.left * t + r2.left * (1 - t),
                    top : r1.top * t + r2.top * (1 - t),
                    width : r1.width * t + r2.width * (1 - t),
                    height : r1.height * t + r2.height * (1 - t)
                };

                this.moveTo(Math.round(rect.left), Math.round(rect.top));
                this.setWidth(Math.round(rect.width));
                this.setHeight(Math.round(rect.height));

                this.m_animCount++;

            },
            /**
             * overriden addState method
             * @param state {string} state to add
             */
            addState : function ( state )
            {
                console.log("add state", state);
                this.base(arguments, state);
                if ( state === "move" ) {
                    this.setOpacity(0.5);
                    this.fireEventDeferred( "movingStart");
                }
            },

            /**
             * removes a state
             * @param state {string} to remove
             */
            removeState : function ( state )
            {
                console.log("remove state", state);
                this.base(arguments, state);
                if ( state === "move" ) {
                    this.setOpacity(1);
//                    this.m_movingDoneDeferred.schedule();
                    //                this.fireEvent("movingDone");
                                    this.fireEventDeferred("movingDone");
                }
            },
            setPositionRect : function ( rect, duration )
            {
                console.log("moving window to", rect);
                //            this.moveTo( rect.left, rect.top);
                //            this.setWidth( rect.width);
                //            this.setHeight( rect.height);
                this.m_animationDuration = duration;
                if ( this.m_animationDuration == null ) {
                    this.m_animationDuration = this.DEFAULT_ANIMATION_DURATION;
                }

                this.m_startingPositionRect = qx.lang.Object.clone(this.getBounds());
                this.m_desiredPositionRect = qx.lang.Object.clone(rect);
                this.m_animCount = 0;
                this.m_animationFrame.startSequence(this.m_animationDuration);
            },

//            _onMovePointerUp : function ( e )
//            {
//                console.log("pointer up");
//                this.base(arguments, e);
//            },
            _onMovePointerMove : function ( e )
            {
                this.base(arguments, e);
                var parent = this.getLayoutParent();
                var box = parent.getContentLocation("box");
                var mouseX = e.getDocumentLeft() - box.left;
                var mouseY = e.getDocumentTop() - box.top;
                if ( this.hasState("move") ) {
                    //                console.log("mmmmoving");
                    this.fireDataEventDeferred("moving", { x : e.getDocumentLeft(), y : e.getDocumentTop() });
                }
            },

            dockLayout : function ()
            {
                return this.m_dockLayout;
            },

            setDockLayout : function ( dockLayout )
            {
                this.m_dockLayout = dockLayout;
                if( this.isDocked()) {
                    this.setAppearance( "dockwindow");
                    this.setResizable( false);
                } else {
                    this.setAppearance( "window");
                    this.setResizable( true);
                }
            },

//            __onResizePointerMove : function(e)
//            {
//                console.log( "onresizepointermove");
//                this.base(arguments, e);
//            },

            /**
             * Returns true if this window is assocated with a dock layout.
             * @returns {boolean}
             */
            isDocked : function ()
            {
                return this.dockLayout() != null;
            },

            defer : function ( fn )
            {
                (new qx.util.DeferredCall(fn)).schedule();
            },

            /**
             * Just like fireEvent, but deferred
             * @param type {String} Event type to fire
             * @param clazz {Class?qx.event.type.Event} The event class
             * @param args {Array?null} Arguments, which will be passed to
             *       the event's init method.
             **/
            fireEventDeferred : function ( type, clazz, args )
            {
                this.defer( function() {
                    this.fireEvent( type, clazz, args);
                }.bind(this));
            },

            /**
             * Just like fireDataEvent but deferred
             *
             * @param type {String} Event type to fire
             * @param data {var} User defined data attached to the event object
             * @param oldData {var?null} The event's old data (optional)
             * @param cancelable {Boolean?false} Whether or not an event can have its default
             *     action prevented. The default action can either be the browser's
             *     default action of a native event (e.g. open the context menu on a
             *     right click) or the default action of a qooxdoo class (e.g. close
             *     the window widget). The default action can be prevented by calling
             *     {@link qx.event.type.Event#preventDefault}
             */
            fireDataEventDeferred : function(type, data, oldData, cancelable)
            {
                this.defer( function() {
                    this.fireDataEvent( type, data, oldData, cancelable);
                }.bind(this));
            },

            m_movingDoneDeferred : null,
            m_animationFrame : null,
            m_dockLayout : null
        }
    });
