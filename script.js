
///////////////////////////////////////////////////////////////////////////////
// Config
///////////////////////////////////////////////////////////////////////////////

var config = {

  // JSON endpoint to fetch data from

  dataUrl: 'https://stats.connector.land/',


  // Column order to display

  columnOrder: {
    hosts: 'prefix url version balance methods owner delay uptime health'.split(' '),
    ledgers: 'prefix url balance methods real delay uptime'.split(' '),
    connectors: 'address delay'.split(' '),
  },


  // Map column names to object keys
  // (in the order it arrives from the server)

  columnNames: {

    hosts: {
      url: 'ILP Kit URL',
      version: 'ILP Kit Version',
      prefix: 'Ledger Prefix',
      balance: 'Max Balance',
      delay: 'Message Delay',
      owner: 'Owner',
      methods: 'Settlement Methods',
      health: 'Health',
      uptime: 'Uptime'
    },

    ledgers: {
      prefix: 'Ledger Prefix',
      balance: 'Max Balance',
      delay: 'Message Delay',
      uptime: 'Uptime',
      url: 'Web Interface',
      methods: 'Settlement Methods',
      real: 'Real Money?'
    },

    connectors: {
      address: 'ILP address',
      delay: 'Quote<br>Delay'
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

    var str = xhr.responseText

    var json = parseHtml(str)
    // console.log(json)

    var data = JSON.parse(json)
    formatData(data)
    // console.log(data)


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

  $.map(obj, function(table, key){


    // Filter out empty rows

    table.rows = table.rows.filter(function(v){ return v !== '' })


    // Add any missing column headers

    table.headers.map(function(name, i){
      if (config.columnOrder[key][i]) return
      var slug = name.replace(/ /g, '-')
      config.columnNames[key][slug] = name
      config.columnOrder[key].push(slug)
    })


    // Convert row array into key:val object

    var columnIndex = Object.keys(config.columnNames[key])

    var rows = obj[key] = table.rows.map(function(cols){
      var obj = {}
      cols.map(function(val, i){
        var col = columnIndex[i]
        obj[col] = val
      })
      return obj
    })


    // Set node rank

    $.each(rows, function(i, v){
      v.rank =
        key == 'hosts' ? (
          /error/i.test(v.version) || /response/i.test(v.methods) ? 2 : // 3 :
          v.uptime !== '100%' || v.health !== '100%' ? 2 :
          1 ) :
        key == 'ledgers' ? (
          /response/i.test(v.methods) ? 2 : // 3 :
          v.uptime == '0%' ? 2 :
          1 ) :
        key == 'connectors' ? (
          Object.keys(v).filter(function(k){ return !!v[k] }).length == 2 ? 2 : // 3 :
          Object.keys(v).filter(function(k){ return v[k] !== 'n/a' && v[k] !== 'fail' }).length == 2 ? 2 :
          1 ) : 0
    })



    // Sort data

    rows.sort(
      firstBy('rank')
      .thenBy('health', -1)
      .thenBy('uptime', -1)
      .thenBy('version', -1)
      .thenBy('delay') )


    // Format values

    $.each(rows, function(i, row){
      $.each(row, function(k, v){

        // Format text

          // Round delay integers

          if (k == 'delay') v = Math.round(v)

          // Add %, ms where needed

          if (k == 'delay') v = v + 'ms'

          if (k == 'uptime') v = v.replace(/(?=[^%]$)/, '%')

          // Strip extra text from ILP version

          if (k == 'version') v = v.replace(/Compatible: ilp-kit /, '')

        // Add HTML (for styling)

          // Emphasis

          if (k == 'prefix' || k == 'address') v = v.replace(/([^.]+\.[^.]+\.)([^.]+)/, '$1<em>$2</em>')

          // Small text

          if (typeof v == 'string') v = v.replace(/(\.\d+%|%$|ms$|^v(?=\d))/, '<small>$1</small>')

          // Links

          if (k == 'url') v = '<a href="https://' + v + '/" target="_blank">' + v + '</a>'

          // Errors, fail, n/a

          if (/error|response/i.test(v) || (/uptime|health/.test(k) && /\b0\b/.test(v))) v = '<span class="err">' + v + '</span>'

          else if (v == 'fail' || v == 'n/a' || v == 'no data') v = '<span class="na">' + v + '</span>'

        row[k] = v

      })
    })


  })

}


// Convert html strings from server response into raw data

function parseHtml(str){

  return str

    // Split html table cells into array of values

    .replace(/"<tr>(.+?)<\/tr>"/g, '[ "$1" ]')
    .replace(/<\/t[dh]>,?<t[dh].*?>/g, '", "')

    // Strip any other html tags left

    .replace(/<.+?>/g, '')

    // Normalize types

      // Convert to proper empty values
      .replace(/"undefined"|"\?"/g, '""')

      // Round percentages up to two decimal points
      //.replace(/"(\d+(?:\.\d{1,2})?)\d*%"/g, '"$1%"')

      // Convert numbers to integers
      .replace(/"(\d+(?:.\d+)?)"/g, '$1')

    // Format values

      .replace(/\\n\(fee for sending one cent\)/g, '')
      .replace(/, Just click here. W/g, '')


}
