import 'instant.page';
import SimpleLightbox from 'simple-lightbox';

import DisqusJS from 'disqusjs';
global.DisqusJS = DisqusJS;

import './js/analytics';

/*****************************************
 * Bootstrap Native
 *****************************************/

import {initCallback} from 'bootstrap.native/src/util/callbacks.js'
import {componentsInit} from 'bootstrap.native/src/util/globals.js'
// import {Util} from 'bootstrap.native/src/util/util.js'

// import Alert from 'bootstrap.native/src/components/alert-native.js'
// import Button from 'bootstrap.native/src/components/button-native.js'
// import Carousel from 'bootstrap.native/src/components/carousel-native.js'
// import Collapse from 'bootstrap.native/src/components/collapse-native.js'
import Dropdown from 'bootstrap.native/src/components/dropdown-native.js'
// import Modal from 'bootstrap.native/src/components/modal-native.js'
// import Popover from 'bootstrap.native/src/components/popover-native.js'
// import ScrollSpy from 'bootstrap.native/src/components/scrollspy-native.js'
// import Tab from 'bootstrap.native/src/components/tab-native.js'
// import Toast from 'bootstrap.native/src/components/toast-native.js'
// import Tooltip from 'bootstrap.native/src/components/tooltip-native.js'

// componentsInit.Alert = [ Alert, '[data-dismiss="alert"]']
// componentsInit.Button = [ Button, '[data-toggle="buttons"]' ]
// componentsInit.Carousel = [ Carousel, '[data-ride="carousel"]' ]
// componentsInit.Collapse = [ Collapse, '[data-toggle="collapse"]' ]
componentsInit.Dropdown = [ Dropdown, '[data-toggle="dropdown"]']
// componentsInit.Modal = [ Modal, '[data-toggle="modal"]' ]
// componentsInit.Popover = [ Popover, '[data-toggle="popover"],[data-tip="popover"]' ]
// componentsInit.ScrollSpy = [ ScrollSpy, '[data-spy="scroll"]' ]
// componentsInit.Tab = [ Tab, '[data-toggle="tab"]' ]
// componentsInit.Toast = [ Toast, '[data-dismiss="toast"]' ]
// componentsInit.Tooltip = [ Tooltip, '[data-toggle="tooltip"],[data-tip="tooltip"]' ]

/*****************************************
 * Page Onload Logic
 *****************************************/

addLoadEvent(function() {
    'use strict';
    initCallback();

    ga('create','UA-37067735-1');
    ga('send', 'pageview', location.pathname + location.search);

    var lightbox_onclick = function() {
        SimpleLightbox.open({items: [this.getAttribute("src") || this.getAttribute("href")]});
        return false;
    };

    var posts = document.getElementsByClassName('post-text');
    for(var i = 0; i < posts.length; i++) {
        var images = posts[i].getElementsByTagName('img');
        for(var j = 0; j < images.length; j++) {
            images[j].onclick = lightbox_onclick;
            images[j].style.cursor = 'pointer';

        }
    }

    var qrcodes = document.getElementsByClassName('qrcode-box');
    for(var i = 0; i < qrcodes.length; i++) {
        qrcodes[i].onclick = lightbox_onclick;
    }

    elderClock.tick();

    console.log('%c欢迎来到 Lan Tian @ Blog。','color:#09f');
});

/*****************************************
 * Elder Clock
 *****************************************/

global.elderClock = {
    last_date: new Date(),
    tick: function() {
        var current_date = new Date();
        this.update_html(current_date);
        if(this.is_new_minute(current_date)) {
            this.last_date = current_date;
            this.minutely();
        }
        setTimeout('elderClock.tick()', 500);
    },
    update_html: function(current_date) {
        var new_html = "";
        if(current_date.getHours() < 10) new_html += '0';
        new_html +=  current_date.getHours() + ':';
        if(current_date.getMinutes() < 10) new_html += '0';
        new_html +=  current_date.getMinutes() + ':';
        if(current_date.getSeconds() < 10) new_html += '0';
        new_html +=  current_date.getSeconds();
        document.getElementById("elderclock-time").innerHTML = new_html;
    },
    is_new_minute: function(current_date) {
        return (current_date.getTime() - current_date.getTime() % 60000)
               > (this.last_date.getTime() - this.last_date.getTime() % 60000);
    },
    minutely: function() {
        let plus1s_container = document.getElementById('elderclock');
        let plus1s_element = document.getElementById("elderclock-plus1s");
        if(plus1s_element != null) {
            plus1s_container.removeChild(plus1s_element);
        }
        plus1s_container.innerHTML += '<span id="elderclock-plus1s">+1s</span>';
    },
};
