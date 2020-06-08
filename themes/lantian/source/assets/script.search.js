import algoliasearch from 'algoliasearch/lite';
import autocomplete from 'autocomplete.js';

addLoadEvent(function() {
    'use strict';
    var client = algoliasearch('***REMOVED***', '***REMOVED***');
    var index = client.initIndex('lantian');

    function newHitsSource(index, params) {
        return function doSearch(query, cb) {
          index
            .search(query, params)
            .then(function(res) {
              cb(res.hits, res);
            })
            .catch(function(err) {
              console.error(err);
              cb([]);
            });
        };
    }

    autocomplete('#search-input', {hint: false}, {
        source: newHitsSource(index, { hitsPerPage: 5 }),
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
    };

    console.log('%c搜索功能已启用。','color:#09f');
});
