import 'instant.page'
import SimpleLightbox from 'simple-lightbox'

import attempt from './js/attempt'

/*****************************************
 * Bootstrap Native
 *****************************************/

import { initCallback } from 'bootstrap.native'

/*****************************************
 * Page Onload Logic
 *****************************************/
;(function () {
  'use strict'

  attempt('Bootstrap.Native', initCallback)

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
    for (const post of posts) {
      for (const img of post.getElementsByTagName('img')) {
        img.onclick = lightbox_onclick
        img.style.cursor = 'pointer'
      }
    }

    let qrcodes = document.getElementsByClassName(
      'qrcode-box'
    ) as HTMLCollectionOf<HTMLImageElement>
    for (const qrcode of qrcodes) {
      qrcode.onclick = lightbox_onclick
    }
  })

  attempt('Interactive Content', function () {
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
        interactive_recurse(child_options.item(0)!.parentElement)
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
})()
