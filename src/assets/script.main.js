import 'instant.page'
import SimpleLightbox from 'simple-lightbox'

import attempt from './js/attempt.js'

import Plausible from 'plausible-tracker'

/*****************************************
 * Bootstrap Native
 *****************************************/

import { initCallback } from 'bootstrap.native'

/*****************************************
 * Page Onload Logic
 *****************************************/

addLoadEvent(function () {
  'use strict'

  attempt('Bootstrap.Native', initCallback)

  attempt('Plausible Analytics', function () {
    'use strict'
    const plausible = Plausible({
      domain: 'lantian.pub',
      trackLocalhost: true,
      apiHost: '',
    })
    plausible.trackPageview()
  })

  attempt('Simple Lightbox', function () {
    'use strict'
    let lightbox_onclick = function (e) {
      SimpleLightbox.open({
        items: [this.getAttribute('src') || this.getAttribute('href')],
      })
      try {
        e.preventDefault()
      } catch (err) {}
      return false
    }

    let posts = document.getElementsByClassName('post-text')
    for (let i = 0; i < posts.length; i++) {
      let images = posts[i].getElementsByTagName('img')
      for (let j = 0; j < images.length; j++) {
        images[j].onclick = lightbox_onclick
        images[j].style.cursor = 'pointer'
      }
    }

    let qrcodes = document.getElementsByClassName('qrcode-box')
    for (let i = 0; i < qrcodes.length; i++) {
      qrcodes[i].onclick = lightbox_onclick
    }
  })

  attempt('Dark Color Scheme', function () {
    /* https://blog.skk.moe/post/hello-darkmode-my-old-friend/ */

    const darkModeStorageKey = 'user-color-scheme' // 作为 localStorage 的 key
    const rootElementDarkModeAttributeName = 'data-user-color-scheme'

    const setLS = (k, v) => {
      try {
        localStorage.setItem(k, v)
      } catch (e) {}
    }

    const getLS = k => {
      try {
        return localStorage.getItem(k)
      } catch (e) {
        return null // 与 localStorage 中没有找到对应 key 的行为一致
      }
    }

    const applyCustomDarkModeSettings = mode => {
      const validColorModeKeys = {
        dark: true,
        light: true,
        auto: true,
      }

      if (!validColorModeKeys[mode]) {
        mode = 'auto'
      }
      setLS(darkModeStorageKey, mode)

      for (const key in validColorModeKeys) {
        if (key == mode) {
          document.getElementById('color-scheme-' + key).classList.add('active')
        } else {
          document
            .getElementById('color-scheme-' + key)
            .classList.remove('active')
        }
      }

      if (mode != 'auto') {
        document.documentElement.setAttribute(
          rootElementDarkModeAttributeName,
          mode
        )
        if (document.getElementById('twine')) {
          document
            .getElementById('twine')
            .contentWindow.document.documentElement.setAttribute(
              rootElementDarkModeAttributeName,
              mode
            )
        }
      } else {
        document.documentElement.removeAttribute(
          rootElementDarkModeAttributeName
        )
        if (document.getElementById('twine')) {
          document
            .getElementById('twine')
            .contentWindow.document.documentElement.removeAttribute(
              rootElementDarkModeAttributeName
            )
        }
      }
    }

    // 当页面加载时，将显示模式设置为 localStorage 中自定义的值（如果有的话）
    applyCustomDarkModeSettings(getLS(darkModeStorageKey))

    document
      .getElementById('color-scheme-auto')
      .addEventListener('click', () => applyCustomDarkModeSettings('auto'))
    document
      .getElementById('color-scheme-light')
      .addEventListener('click', () => applyCustomDarkModeSettings('light'))
    document
      .getElementById('color-scheme-dark')
      .addEventListener('click', () => applyCustomDarkModeSettings('dark'))
  })

  attempt('Interactive Content (Custom)', function () {
    'use strict'

    let interactive_update = function (element) {
      let this_tag = element.dataset.ltiTag
      let child = document.getElementById(`lti-content-${this_tag}`)
      if (!child) {
        return
      }

      if (element.checked) {
        child.classList.remove('d-none')
        return
      }

      child.classList.add('d-none')

      let child_options = child.getElementsByClassName('lti-option')
      if (!child_options) {
        return
      }

      /* bootstrap native js will handle state save & restore */
      Array.prototype.slice.call(child_options).forEach(function (e) {
        e.classList.remove('active')
        e.checked = false
        // interactive_onclick(e);
      })

      if (child_options.length) {
        interactive_recurse(child_options.item(0).parentElement)
      }
    }

    let interactive_recurse = function (container) {
      let option_list = container.getElementsByClassName('lti-option')
      if (!option_list) {
        return
      }

      let option_array = Array.prototype.slice.call(option_list)

      // first go through the unselected options
      option_array
        .filter(e => {
          return !e.checked
        })
        .forEach(interactive_update)

      // then handle the selected one
      option_array
        .filter(e => {
          return e.checked
        })
        .forEach(interactive_update)
    }

    let interactive_onclick = function () {
      interactive_recurse(this.parentElement)
    }

    let options = Array.prototype.slice.call(
      document.getElementsByClassName('lti-option')
    )
    options.forEach(option => {
      option.onclick = interactive_onclick
    })

    let contents = Array.prototype.slice.call(
      document.getElementsByClassName('lti-content')
    )
    contents.forEach(content => {
      content.classList.add('d-none')
    })
  })

  attempt('Interactive Content (Twine)', function () {
    'use strict'
    window.iframeResizer = () => {
      var iframes = document.querySelectorAll('iframe')
      if (iframes.length == 0) {
        return
      }

      for (let i = 0; i < iframes.length; i++) {
        try {
          iframes[i].height =
            iframes[i].contentWindow.document.body.scrollHeight
        } catch (e) {}
      }

      setTimeout(iframeResizer, 100)
    }

    window.iframeResizer()
  })
})
