/*
 * ogrid.CommandBar
 *
 * Commandbar UX component
 */


ogrid.CommandBar = ogrid.Class.extend({
    //private attributes
    _options:{},
    _clrbutton: null,

    //public attributes


    //constructor
    init: function(clrbutton, options) {
        if (options) {
            //ogrid.mixin(this._options);
            this._options = options;
        }

        this._clrbutton = clrbutton;

        //setup event handlers on each button
        this._clrbutton.click($.proxy(this._onClearClick, this));
        $("#ogrid-advanced-btn").click($.proxy(this._onAdvancedSearchClick, this));
        $("#ogrid-manage-btn").click($.proxy(this._onManageClick, this));
        $("#ogrid-logout-item").click($.proxy(this._onLogout, this));

        //subscribe to applicable opengrid client events
        ogrid.Event.on(ogrid.Event.types.LOGGED_IN, $.proxy(this._onLoggedIn, this));

        //TODO: move handling of 'mobile-mode-change' event to Main class?
        ogrid.Event.on(ogrid.Event.types.MOBILE_MODE_CHANGED, $.proxy(this._onMobileModeChanged, this));


        //refresh mobile mode view manually at startup
        this._onMobileModeChanged({message: ogrid.App.mobileView()});

    },


    //private methods
    _onMobileModeChanged: function(e) {
        var mobileMode = e.message;

        console.log('mobileMode=' + mobileMode);
        if (mobileMode) {
            $('#ogrid-menu a').filter('.btn').addClass('small-screen-menuitem');
        } else {
            $('#ogrid-menu a').filter('.btn').removeClass('small-screen-menuitem');
        }
    },

    _onAdvancedSearchClick: function() {
        //we chose to use jquery's animate for this (instead of CSS3 transitions) to not have to worry about compatibility with older browsers
        if (!this._isPanelVisible( $("#ogrid-task-advanced-search")) ) {

            //hide manage panel, if visible
            if (this._isPanelVisible( $("#ogrid-admin-ui")) ) {
                //toggle
                $("#ogrid-admin-ui").addClass('hide'); //avoid sliding windows look
                this._onManageClick();
            }
            $("#ogrid-task-advanced-search").removeClass('hide');
            $("#ogrid-task-advanced-search").switchClass('','visible', 500);

            $(".ogrid-nav-btn").find(".active").removeClass("active");
            $("#ogrid-advanced-btn").addClass('active');
        } else {
            $("#ogrid-task-advanced-search").switchClass('visible','hide', 500);
            $("#ogrid-advanced-btn").removeClass('active');

            //remove focus from button
            $('#ogrid-advanced-btn').blur();
        }

        //auto-hide menu when in mobile mode
        if (ogrid.App.mobileView()) {
            this._hideMenu();
        }

        //prevent default event processing
        //return true;
    },

    _hideMenu: function() {
        $('#ogrid-menu').collapse('hide');
    },

    _isPanelVisible: function(selector) {
        return (selector.css('right').substring(0,1) !== '-');
    },

    _onManageClick: function() {
        //we chose to use jquery's animate for this (instead of CSS3 transitions) to not have to worry about compatibility with older browsers

        //if negative right value, must be hidden
        //if ($("#ogrid-admin-ui").css('right').substring(0,1) === '-') {
        if (!this._isPanelVisible( $("#ogrid-admin-ui")) ) {

            //hide advanced search panel, if visible
            if (this._isPanelVisible( $("#ogrid-task-advanced-search")) ) {
                $("#ogrid-task-advanced-search").addClass('hide'); //avoid sliding windows look
                //toggle
                this._onAdvancedSearchClick();
            }

            $("#ogrid-admin-ui").removeClass('hide');
            $("#ogrid-admin-ui").switchClass('','visible', 500);

            $(".ogrid-nav-btn").find(".active").removeClass("active");
            $("#ogrid-manage-btn").addClass('active');
        } else {
            $("#ogrid-admin-ui").switchClass('visible','hide', 500);
            $("#ogrid-manage-btn").removeClass('active');

            //remove focus from button
            $('#ogrid-manage-btn').blur();
        }

        //auto-hide menu when in mobile mode
        if (ogrid.App.mobileView()) {
            this._hideMenu();
        }
    },

    _onLoggedIn: function(e) {
        //refresh user name
        var user = e.message;
        var userProfile = user.getProfile();
        $('#ogrid-user-name').html(userProfile.firstName + ' ' + userProfile.lastName  + '<span class="caret"></span>');

        //secure buttons
        var me = this;

        //hide all secured functions by default (so they are disabled in case an error occurs)
        this._hideAllFunctions();
        user.getAccessList(function(accessList) {
            me._secureFunction(
                me,
                me._getRequiredAccess(ogrid.SecuredFunctions.MANAGE),
                '#ogrid-manage-btn',
                accessList);
            //me._secureFunction(
            //    me,
            //    me._getRequiredAccess(ogrid.SecuredFunctions.ADVANCED_SEARCH),
            //    '#ogrid-advanced-btn', accessList);
        });

        //hide both admin and advanced search panels
        if (this._isPanelVisible( $("#ogrid-task-advanced-search")) ) {
            $("#ogrid-task-advanced-search").addClass('hide'); //avoid sliding windows look
            this._onAdvancedSearchClick();
        }

        if (this._isPanelVisible( $("#ogrid-admin-ui")) ) {
            $("#ogrid-admin-ui").addClass('hide'); //avoid sliding windows look
            this._onManageClick();
        }
        //invoke clear
        this._onClearClick();
    },


    _secureFunction: function(context, fnList, btn, accessList) {
        if (!context._userHasFunctionAccess(fnList, accessList)) {
            $(btn).addClass('hide');
        } else {
            $(btn).removeClass('hide');
        }
    },


    _hideAllFunctions: function() {
        $('#ogrid-manage-btn').addClass('hide');
        //$('#ogrid-advanced-btn').addClass('hide');
    },

    _userHasFunctionAccess: function(fnList, accessList) {
        var ok=false;
        $.each(fnList, function(i, v) {
            if (($.inArray(v, accessList) > -1) ) {
                ok = true;
            } else {
                ok = false;
                return false;
            }
        });
        return ok;
    },


    _getRequiredAccess: function(funcName) {
        var access = [];
        $.each(ogrid.Config.commandBar.commands, function(i, v) {
            if (v.name === funcName) {
                access = v.requiredAccess;
                return;
            }
        });
        return access;
    },


    _onLogout: function() {
        ogrid.App.getSession().logout();

        //broadcast that we're logged out
        ogrid.Event.raise(ogrid.Event.types.LOGGED_OUT);
    },

    _onClearClick: function() {
        //console.log("Clear clicked");
        ogrid.Event.raise(ogrid.Event.types.CLEAR);

        //auto-hide menu when in mobile mode
        if (ogrid.App.mobileView()) {
            this._hideMenu();
        }
    }

    //public methods

});