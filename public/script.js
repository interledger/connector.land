
///////////////////////////////////////////////////////////////////////////////
// Config
///////////////////////////////////////////////////////////////////////////////

var config = {

  // JSON endpoint to fetch data from

  dataUrl: '/stats' + window.location.search,


  // Column order to display

  columnOrder: {
    hosts: 'hostname version lastDownTime health latency'.split(' '),
    ledgers: 'comingbacksoon'.split(' '),
    connectors: 'comingbacksoon'.split(' '),
  },


  // Map column names to object keys
  // (in the order it arrives from the server)

  columnNames: {

    hosts: {
      hostname: 'ILP Kit URL',
      version: 'ILP Kit Version',
      lastDownTime: 'Up since (hours)',
      health: 'Up %',
      latency: 'HTTP Roundtrip Time (ms)',
    },

    ledgers: {
      comingbacksoon: 'Coming back soon!'
    },

    connectors: {
      comingbacksoon: 'Coming back soon!'
    }

  }

}




///////////////////////////////////////////////////////////////////////////////
// Do the thing
///////////////////////////////////////////////////////////////////////////////

// Wait for images to load

  $(function(){
    var img = $('.logo')[0]
    img.complete
      ? ready()
      : $(img).on('load', ready)
    function ready(){
      $('html').addClass('img-ready')
    }
  })


// Target touch devices in css

  if ('ontouchstart' in window) $('html').addClass('is-touch')


// Show/hide about text

  $('.hero .toggle').click(function(){
    $('.about').add(this).toggleClass('on')
  })


// Setup nicer easing function for scroll animation

  jQuery.easing.easeInOutQuart = function (x, t, b, c, d) {
    if ((t/=d/2) < 1) return c/2*t*t*t*t + b
    return -c/2 * ((t-=2)*t*t*t - 2) + b
  }


// Navigation

  function nav(root){

    var sections = root.children(),
        nav = $('nav'),
        links = $('a', nav)

    function scrollToSection(id){
      root.stop().scrollTo(sections.filter('[data-id="'+id+'"]'), { duration: 1000, interrupt: true, easing: 'easeInOutQuart' })
    }

    function highlightSectionLink(id){
      links.filter('[href="#/'+id+'"]').addClass('active')
        .siblings().removeClass('active')
    }

    // Go to section on url change

    activateSectionFromUrl()
    $(window).on('hashchange', activateSectionFromUrl)
    function activateSectionFromUrl(){
      var id = location.hash.slice(2) || sections.first().attr('data-id')
      if (!id) return
      root.disableScrollDetection = true
      setTimeout(function(){ root.disableScrollDetection = false }, 1000)
      scrollToSection(id)
      highlightSectionLink(id)
    }

    // Go to section on link click (if same url)

    $('a[href^="#"]').click(activateSectionFromUrl)

    // Detect active section on scroll

    root.on('scroll', function(){
      if (root.disableScrollDetection) return
      (window.requestAnimationFrame || setTimeout)(function(){
        var id = sections.filter(function(){
          return $(this).offset().left < window.innerWidth * .5
        }).last().attr('data-id')
        highlightSectionLink(id)
      })
    })

    // Scroll down to content on nav click

    $('a[href^="#"]').click(function(){
      $(window).scrollTo(nav, { duration: 1000, easing: 'easeInOutQuart', interrupt: true })
    })

  }


// Fetch and display the content

  $.get(config.dataUrl, function(res, e, xhr){


    // Prepare the data

    var json = xhr.responseText

    var stats = JSON.parse(json)
    data = {}
    for (var tab in stats) {
      data[tab] =  Object.keys(stats[tab]).map(i => stats[tab][i])
    }
    formatData(data)


    // Add html tables to page

    var root = $('.content')

    var html = $.map(config.columnOrder, function(cols, key){
      return '                  \
        <div class="section" data-id="' + key + '">  \
          <table class="' + key + '"> \
            <thead>             \
              <tr>              \
                ' + cols.map(function(val){ return '<th class="col-' + val + '"><div><span>' + config.columnNames[key][val] + '</span></div></th>' }).join('') + '\
              </tr>             \
            </thead>            \
            <tbody>             \
              ' + data[key].map(function(row){ return ' \
                <tr class="rank-' + row.rank + '">      \
                  ' + cols.map(function(key){
                    return '\
                      <td class="col-' + key + '">  \
                        ' + (row[key] || '') + '    \
                      </td>                         \
                  ' }).join('') + '\
                </tr>           \
              ' }).join('') + ' \
            </tbody>            \
          </table>              \
        </div>                  \
      '
    }).join('')

    $(html).appendTo(root)

    $('html').addClass('content-ready')

    nav(root)


    // Sortable table

    Sortable.typesObject.numeric.match = function(v){
      return v.match(/^\S?\d[\d.]+\S*$/)
    }

    $('table')
      .on('click', 'th', function(){
        $(this).closest('table').addClass('user-sorted')
      })
      .each(function(){
        Sortable.initTable(this)
      })

  })




///////////////////////////////////////////////////////////////////////////////
// Data crunching
///////////////////////////////////////////////////////////////////////////////


// Format raw data into workable data structure

function formatData(obj){

  $.map(obj, function(rows, key){


    // Filter out empty rows
    rows = rows.filter(function(v){ return v !== '' })

    // Sort data

    rows.sort(
      firstBy(v => (v.version === 'Compatible: ilp-kit v2.0.0' || v.version === 'Compatible: ilp-kit v2.0.1' ? 0 : 1))
      .thenBy(v => Math.round(10 * v.health), -1)
      .thenBy('latency'))

    // Format values

    $.each(rows, function(i, row){
      $.each(row, function(k, v){
        // Format text
          // Round latency integers

          if (k == 'latency') v = Math.round(v)

          // Add % where needed

          if (k == 'health') v = Math.round(100 * v) + '%'

          if (k == 'lastDownTime') {
            v = Math.round((new Date().getTime() - v) / 60000)
            let measure = 'minute'
            if (v > 1440) {
              v = Math.round(v / 1440)
              measure = 'day'
            } else if (v > 60) {
              v = Math.round(v / 60)
              measure = 'hour'
            }
            if (v !== 1) {
              measure += 's'
            }
            v += ' ' + measure
          }

          // Strip extra text from ILP version

          if (k == 'version') v = v.replace(/Compatible: ilp-kit /, '')

        // Add HTML (for styling)

          // Emphasis

          if (k == 'prefix' || k == 'address') v = v.replace(/([^.]+\.[^.]+\.)([^.]+)/, '$1<em>$2</em>')

          // Small text

          if (typeof v == 'string') v = v.replace(/(\.\d+%|%$|ms$|^v(?=\d))/, '<small>$1</small>')

          // Links

          if (k == 'hostname') v = '<a href="https://' + v + '/" target="_blank">' + v + '</a>'

          // Errors, fail, n/a

          if (/error|response/i.test(v) || (/uptime|health/.test(k) && /\b0\b/.test(v))) v = '<span class="err">' + v + '</span>'

          else if (v == 'fail' || v == 'n/a' || v == 'no data') v = '<span class="na">' + v + '</span>'

        row[k] = v
      })
    })
    obj[key] = rows
  })
}
