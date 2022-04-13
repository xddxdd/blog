import 'instant.page';
import SimpleLightbox from 'simple-lightbox';

import attempt from './js/attempt.js';

import cfga from './js/cfga.js';
import Waline from '@waline/client/dist/Waline.noStyle.js';

/*****************************************
 * Bootstrap Native
 *****************************************/

import { initCallback } from 'bootstrap.native/src/util/init.js';

/*****************************************
 * Page Onload Logic
 *****************************************/

addLoadEvent(function () {
  'use strict';

  attempt('Bootstrap.Native', initCallback);

  attempt('Google Analytics', function () {
    'use strict';
    // ga('create', 'UA-37067735-1');
    // ga('send', 'pageview', location.pathname + location.search);
    cfga(
      window,
      document,
      navigator,
      'UA-37067735-1',
      'https://ga.lantian.pub/jquery.min.js',
    );
  });

  attempt('Simple Lightbox', function () {
    'use strict';
    let lightbox_onclick = function (e) {
      SimpleLightbox.open({
        items: [this.getAttribute('src') || this.getAttribute('href')],
      });
      try {
        e.preventDefault();
      } catch (err) {}
      return false;
    };

    let posts = document.getElementsByClassName('post-text');
    for (let i = 0; i < posts.length; i++) {
      let images = posts[i].getElementsByTagName('img');
      for (let j = 0; j < images.length; j++) {
        images[j].onclick = lightbox_onclick;
        images[j].style.cursor = 'pointer';
      }
    }

    let qrcodes = document.getElementsByClassName('qrcode-box');
    for (let i = 0; i < qrcodes.length; i++) {
      qrcodes[i].onclick = lightbox_onclick;
    }
  });

  attempt('Dark Color Scheme', function () {
    /* https://blog.skk.moe/post/hello-darkmode-my-old-friend/ */

    const darkModeStorageKey = 'user-color-scheme'; // 作为 localStorage 的 key
    const darkModeMediaQueryKey = '--color-mode';
    const rootElementDarkModeAttributeName = 'data-user-color-scheme';
    const darkModeTogglebuttonElement = document.getElementById('dark-mode');

    const setLS = (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    };

    const removeLS = (k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    };

    const getLS = (k) => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null; // 与 localStorage 中没有找到对应 key 的行为一致
      }
    };

    const getModeFromCSSMediaQuery = () => {
      const res = getComputedStyle(document.documentElement).getPropertyValue(
        darkModeMediaQueryKey,
      );
      if (res.length) return res.replace(/\"/g, '').trim();
      return res === 'dark' ? 'dark' : 'light';

      // 使用 matchMedia API 的写法会优雅的多
      // return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };

    const applyCustomDarkModeSettings = (mode) => {
      const validColorModeKeys = {
        dark: true,
        light: true,
      };

      // 接受从「开关」处传来的模式，或者从 localStorage 读取
      const currentSetting = mode || getLS(darkModeStorageKey);

      if (currentSetting === getModeFromCSSMediaQuery()) {
        // 当用户自定义的显示模式和 prefers-color-scheme 相同时重置、恢复到自动模式
        document.documentElement.removeAttribute(
          rootElementDarkModeAttributeName,
        );
        if (document.getElementById('twine')) {
          document
            .getElementById('twine')
            .contentWindow.document.documentElement.removeAttribute(
              rootElementDarkModeAttributeName,
            );
        }
        removeLS(darkModeStorageKey);
      } else if (validColorModeKeys[currentSetting]) {
        // 相比 Array#indexOf，这种写法 Uglify 后字节数更少
        document.documentElement.setAttribute(
          rootElementDarkModeAttributeName,
          currentSetting,
        );
        if (document.getElementById('twine')) {
          document
            .getElementById('twine')
            .contentWindow.document.documentElement.setAttribute(
              rootElementDarkModeAttributeName,
              currentSetting,
            );
        }
      } else {
        // 首次访问或从未使用过开关、localStorage 中没有存储的值，currentSetting 是 null
        // 或者 localStorage 被篡改，currentSetting 不是合法值
        document.documentElement.removeAttribute(
          rootElementDarkModeAttributeName,
        );
        if (document.getElementById('twine')) {
          document
            .getElementById('twine')
            .contentWindow.document.documentElement.removeAttribute(
              rootElementDarkModeAttributeName,
            );
        }
        removeLS(darkModeStorageKey);
      }
    };

    const toggleCustomDarkMode = () => {
      const invertDarkModeObj = {
        dark: 'light',
        light: 'dark',
      };

      let currentSetting = getLS(darkModeStorageKey);

      if (invertDarkModeObj[currentSetting]) {
        // 从 localStorage 中读取模式，并取相反的模式
        currentSetting = invertDarkModeObj[currentSetting];
      } else if (currentSetting === null) {
        // localStorage 中没有相关值，或者 localStorage 抛了 Error
        // 从 CSS 中读取当前 prefers-color-scheme 并取相反的模式
        currentSetting = invertDarkModeObj[getModeFromCSSMediaQuery()];
      } else {
        // 不知道出了什么幺蛾子，比如 localStorage 被篡改成非法值
        return; // 直接 return;
      }
      // 将相反的模式写入 localStorage
      setLS(darkModeStorageKey, currentSetting);

      return currentSetting;
    };

    // 当页面加载时，将显示模式设置为 localStorage 中自定义的值（如果有的话）
    applyCustomDarkModeSettings();

    darkModeTogglebuttonElement.addEventListener('click', () => {
      // 当用户点击「开关」时，获得新的显示模式、写入 localStorage、并在页面上生效
      applyCustomDarkModeSettings(toggleCustomDarkMode());
    });
  });

  attempt('Waline', function () {
    if (typeof waline_config !== 'undefined') {
      Waline(waline_config);
    }
    Waline.Widget.RecentComments({
      serverURL: 'https://comments.lantian.pub',
      count: 10,
    }).then(({ comments }) => {
      document.getElementById('recent-comments').innerHTML = comments
        .map((comment) => {
          let text = comment.comment.replace(/(<([^>]+)>)/gi, '');
          return (
            '<li>' +
            comment.nick +
            ' <a href="' +
            comment.url +
            '">' +
            text +
            '</a></li>'
          );
        })
        .join('');
    });
  });

  attempt('Interactive Content (Custom)', function () {
    'use strict';

    let interactive_update = function (element) {
      let this_tag = element.dataset.ltiTag;
      let child = document.getElementById(`lti-content-${this_tag}`);
      if (!child) {
        return;
      }
      ``;

      if (element.checked) {
        child.classList.remove('d-none');
        return;
      }

      child.classList.add('d-none');

      let child_options = child.getElementsByClassName('lti-option');
      if (!child_options) {
        return;
      }

      /* bootstrap native js will handle state save & restore */
      Array.prototype.slice.call(child_options).forEach(function (e) {
        e.classList.remove('active');
        e.checked = false;
        // interactive_onclick(e);
      });

      if (child_options.length) {
        interactive_recurse(child_options.item(0).parentElement);
      }
    };

    let interactive_recurse = function (container) {
      let option_list = container.getElementsByClassName(
        'lti-option',
      );
      if (!option_list) {
        return;
      }

      let option_array = Array.prototype.slice.call(option_list);

      // first go through the unselected options
      option_array
        .filter((e) => {
          return !e.checked;
        })
        .forEach(interactive_update);

      // then handle the selected one
      option_array
        .filter((e) => {
          return e.checked;
        })
        .forEach(interactive_update);
    };

    let interactive_onclick = function () {
      interactive_recurse(this.parentElement);
    };

    let options = Array.prototype.slice.call(
      document.getElementsByClassName('lti-option'),
    );
    options.forEach((option) => {
      option.onclick = interactive_onclick;
    });

    let contents = Array.prototype.slice.call(
      document.getElementsByClassName('lti-content'),
    );
    contents.forEach((content) => {
      content.classList.add('d-none');
    });
  });

  attempt('Interactive Content (Twine)', function () {
    'use strict';
    window.iframeResizer = () => {
      var iframes = document.querySelectorAll('iframe');
      if (iframes.length == 0) {
        return;
      }

      for (let i = 0; i < iframes.length; i++) {
        try {
          iframes[i].height =
            iframes[i].contentWindow.document.body.scrollHeight;
        } catch (e) {}
      }

      setTimeout(iframeResizer, 100);
    };

    window.iframeResizer();
  });
});
