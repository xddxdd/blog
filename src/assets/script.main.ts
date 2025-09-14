import 'instant.page'
// @ts-ignore
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
    let lightbox_onclick = function (
      this: GlobalEventHandlers,
      ev: MouseEvent
    ) {
      const e = ev.target as HTMLImageElement
      SimpleLightbox.open({
        items: [e.src],
      })
      try {
        ev.preventDefault()
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

    let interactive_update = function (element: HTMLInputElement) {
      let this_tag = element.dataset.ltiTag!
      let child = document.getElementById(`lti-content-${this_tag}`)
      if (!child) {
        return
      }

      if (element.checked) {
        child.classList.remove('d-none')
        return
      }

      child.classList.add('d-none')

      let child_options = Array.from(
        child.getElementsByClassName(
          'lti-option'
        ) as HTMLCollectionOf<HTMLInputElement>
      )
      if (child_options.length == 0) {
        return
      }

      /* bootstrap native js will handle state save & restore */
      child_options.forEach(function (e) {
        e.classList.remove('active')
        e.checked = false
        // interactive_onclick(e);
      })

      if (child_options.length) {
        interactive_recurse(child_options[0]!.parentElement! as HTMLDivElement)
      }
    }

    let interactive_recurse = function (container: HTMLDivElement) {
      let option_list = Array.from(
        container.getElementsByClassName(
          'lti-option'
        ) as HTMLCollectionOf<HTMLInputElement>
      )

      if (option_list.length == 0) {
        return
      }

      // first go through the unselected options
      option_list
        .filter(e => {
          return !e.checked
        })
        .forEach(interactive_update)

      // then handle the selected one
      option_list
        .filter(e => {
          return e.checked
        })
        .forEach(interactive_update)
    }

    let interactive_onclick = function (
      this: GlobalEventHandlers,
      ev: MouseEvent
    ) {
      const elem = ev.target as HTMLInputElement
      interactive_recurse(elem.parentElement as HTMLDivElement)
    }

    let options = Array.from(
      document.getElementsByClassName(
        'lti-option'
      ) as HTMLCollectionOf<HTMLInputElement>
    )
    options.forEach(option => (option.onclick = interactive_onclick))

    let contents = Array.from(
      document.getElementsByClassName(
        'lti-content'
      ) as HTMLCollectionOf<HTMLDivElement>
    )
    contents.forEach(content => content.classList.add('d-none'))
  })
})()
