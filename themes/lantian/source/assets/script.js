import 'bootstrap.native/dist/bootstrap-native-v4';
import 'instant.page';
import SimpleLightbox from 'simple-lightbox';
/*import algoliasearch from 'algoliasearch/lite';
import autocomplete from 'autocomplete.js';*/

import './js/analytics';

addLoadEvent(function() {
    'use strict';
    ga('create','UA-37067735-1');
    ga('send', 'pageview', location.pathname + location.search);
    // $('.post-text img').each(function(){
    //     if ($(this).parent().is('a')) return;
    //     $(this).wrap('<a href="' + this.src + '" title="' + this.alt + '" class="lightbox"></a>');
    // });
    // $('.post-text a').each(function() {
    //     $(this).simpleLightbox({nav:false,showCounter:false});
    // });
    // $('.qrcode-box').each(function() {
    //     $(this).simpleLightbox({fileExt:false,nav:false,showCounter:false});
    // });

    var lightbox_onclick = function() {
        SimpleLightbox.open({items: [this.href]});
        return false;
    };

    var posts = document.getElementsByClassName('post-text');
    for(var i = 0; i < posts.length; i++) {
        var images = posts[i].getElementsByTagName('img');
        for(var j = 0; j < images.length; j++) {
            var wrapper = document.createElement('a');
            wrapper.setAttribute('href', images[j].src);
            wrapper.setAttribute('target', '_blank');
            wrapper.appendChild(images[j].cloneNode(true));
            wrapper.onclick = lightbox_onclick;
            images[j].parentNode.replaceChild(wrapper, images[j]);
        }
    }

    var qrcodes = document.getElementsByClassName('qrcode-box');
    for(var i = 0; i < qrcodes.length; i++) {
        qrcodes[i].onclick = lightbox_onclick;
    }

    elderClock.tick();

    let quicklink = document.getElementById('quicklink');
    if(quicklink != null) {
        let quicklinkInitialPosition = document.getElementById('quicklink-initial-position');
        let postNaviPosition = document.getElementById('post-navi');
        if(quicklinkInitialPosition != null) {
            let window_onscroll_original = window.onscroll;
            window.onscroll = function() {
                if(quicklinkInitialPosition.getBoundingClientRect().top + quicklinkInitialPosition.getBoundingClientRect().height <= 0) {
                    quicklink.classList.add('quicklink-float');
                } else {
                    quicklink.classList.remove('quicklink-float');
                }
                if(postNaviPosition) {
                    if(quicklink.getBoundingClientRect().height >= postNaviPosition.getBoundingClientRect().top) {
                        quicklink.classList.add('quicklink-over-position');
                    } else {
                        quicklink.classList.remove('quicklink-over-position');
                    }
                }
                if(window_onscroll_original) {
                    window_onscroll_original();
                }
            }
        }
    }
    
    /*var client = algoliasearch('MU6U5GYQMI', '980c1cdb13ca7904d196dc74f757d7b1');
    var index = client.initIndex('lantian');

    autocomplete('#search-input', {hint: false}, {
        source: autocomplete.sources.hits(index, { hitsPerPage: 5 }),
        displayKey: 'title',
        templates:  {
            suggestion: function(suggestion) {
                let dateObj = new Date(suggestion.date);
                let dateStr = "";
                dateStr += (dateObj.getFullYear() % 100) + '-';
                dateStr += (dateObj.getMonth() < 9 ? '0' : '') + (dateObj.getMonth() + 1) + '-';
                dateStr += (dateObj.getDate() <= 9 ? '0' : '') + dateObj.getDate();

                return dateStr + '《<span class="aa-suggestion-title">' + suggestion.title + '</span>》';
            },
            footer: "<div class='text-right'><small>搜索服务由 Algolia 提供</small> <i class=\"fab fa-lg fa-algolia\"></i></div>"
        }
    }).on('autocomplete:selected', function(event, suggestion, dataset, context) {
        window.location.href = suggestion.permalink;
    });

    document.getElementById('search-button').onclick = function() {
        document.getElementById('search-bar').classList.toggle('d-none');
    };*/

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
        // $('#elderclock-time').html(new_html);
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
