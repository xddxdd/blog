import 'bootstrap.native/dist/bootstrap-native-v4';
import 'instant.page';
import SimpleLightbox from 'simple-lightbox';
import DisqusJS from 'disqusjs'
import './js/analytics';

global.DisqusJS = DisqusJS;

addLoadEvent(function() {
    'use strict';
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
