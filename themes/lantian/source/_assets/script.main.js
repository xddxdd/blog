import 'instant.page';
import SimpleLightbox from 'simple-lightbox';

import DisqusJS from 'disqusjs/src/disqus';
global.DisqusJS = DisqusJS;

import attempt from './js/attempt';
import elderClock from './js/elderclock';

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

    attempt('Bootstrap.Native', initCallback);

    attempt('Google Analytics', function() {
        'use strict';
        ga('create','UA-37067735-1');
        ga('send', 'pageview', location.pathname + location.search);    
    });

    attempt('Simple Lightbox', function() {
        'use strict';
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
    });

    attempt('ElderClock', function() {
        'use strict';
        elderClock();
    });
});
