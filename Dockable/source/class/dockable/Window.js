qx.Class.define('dockable.Window',
{
    extend : qx.ui.window.Window,

    /**
     * constructor
     */
    construct : function() {
        this.base(arguments);
        this.setUseMoveFrame( false);
        this.m_movingDoneDeferred = null;
        this.m_animationFrame = new qx.bom.AnimationFrame();
        this.m_animationFrame.on("end", this._animationEndCB.bind(this));;
        this.m_animationFrame.on("frame", this._animationFrameCB.bind(this));

        this.m_movingDoneDeferred = new qx.util.DeferredCall(
            this.fireEvent.bind(this,"movingDone"));
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
        movingDone : "qx.event.type.Event"
    },

    /**
     * members
     */
    members :
    {
        _animationEndCB: function() {
            var rect = this.m_desiredPositionRect;
            if( rect == null) return;
            this.moveTo( rect.left, rect.top);
            this.setWidth( rect.width);
            this.setHeight( rect.height);
            console.log( "anim count=", this.m_animCount);
        },
        _animationFrameCB: function( timePassed) {
            var r2 = this.m_desiredPositionRect;
            if( r2 == null) return;
            var r1 = this.m_startingPositionRect;
            if( r1 == null) return;
            var t = 1 - timePassed / this.m_animationDuration;
            t = t * t;
//            t = Math.sqrt(t);

//            var v = t-1;
//            var p = 0.3;
//            t = -Math.pow(2, 10 * v) * Math.sin( (v - p / 4) * 2 * Math.PI / p );


            var rect = {
                left: r1.left * t + r2.left * (1-t),
                top: r1.top * t + r2.top * (1-t),
                width: r1.width * t + r2.width * (1-t),
                height: r1.height * t + r2.height * (1-t)
            };

            this.moveTo( Math.round(rect.left), Math.round(rect.top));
            this.setWidth( Math.round(rect.width));
            this.setHeight( Math.round(rect.height));

            this.m_animCount ++;

        },
        /**
         * overriden addState method
         * @param state {string} state to add
         */
        addState : function(state)
        {
            console.log("add state", state);
            if( state === "move") {
                this.setOpacity(0.5);
            }
            this.base(arguments, state);
        },

        /**
         * removes a state
         * @param state {string} to remove
         */
        removeState : function(state)
        {
            console.log("remove state", state);
            this.base(arguments, state);
            if( state === "move") {
                this.setOpacity(1);
                this.m_movingDoneDeferred.schedule();
//                this.fireEvent("movingDone");
            }
        },
        setPositionRect: function(rect, duration) {
            console.log("moving window to", rect);
//            this.moveTo( rect.left, rect.top);
//            this.setWidth( rect.width);
//            this.setHeight( rect.height);
            this.m_animationDuration = duration;
            if( this.m_animationDuration == null) {
                this.m_animationDuration = this.DEFAULT_ANIMATION_DURATION;
            }

            this.m_startingPositionRect = qx.lang.Object.clone( this.getBounds());
            this.m_desiredPositionRect = qx.lang.Object.clone( rect);
            this.m_animCount = 0;
            this.m_animationFrame.startSequence( this.m_animationDuration);
        },

        _onMovePointerUp : function(e)
        {
            console.log("pointer up");
            this.base(arguments, e);
        },
        _onMovePointerMove : function(e)
        {
            this.base(arguments, e);
            var parent = this.getLayoutParent();
            var box = parent.getContentLocation("box");
            var mouseX = e.getDocumentLeft() - box.left;
            var mouseY = e.getDocumentTop() - box.top;
            if (this.hasState("move")) {
                //                console.log("mmmmoving");
                this.fireDataEvent("moving", { x: e.getDocumentLeft(), y: e.getDocumentTop() });
            }
        },

        m_movingDoneDeferred: null,
        m_animationFrame: null
    }
});
