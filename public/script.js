
///////////////////////////////////////////////////////////////////////////////
// Config
///////////////////////////////////////////////////////////////////////////////

var config = {

  // Column order to display

  columnOrder: {
    connectors: 'address network'.split(' ')
  },


  // Map column names to object keys
  // (in the order it arrives from the server)

  columnNames: {
    connectors: {
      address: 'Address',
      network: 'Network'
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
      root.scrollTop(sections.filter('[data-id="'+id+'"]'), { duration: 1000, interrupt: true, easing: 'easeInOutQuart' })
    }

    function highlightSectionLink(id){
      links.filter('[href="#/'+id+'"]').addClass('active')
        .siblings().removeClass('active')
    }

    // Go to section on url change

    // activateSectionFromUrl()
    // window.on('hashchange', activateSectionFromUrl)
    window.onhashchange = activateSectionFromUrl()
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
      $('html, body').animate({ scrollTop: $('nav').offset().top }, 1000)
    })

  }

$.get('/routing', function(res, e, xhr) {
  var json = xhr.responseText
  var connectors = JSON.parse(json)
  $.post('/pingRoutes', {routes: connectors}, function(routeStatus) {
    var connectorHtmlArray = ['<div class="section" data-id="connectors">\
          <table class="connectors">\
            <thead>\
              <tr>\
                <th class="col-connectoraddress">\
                  <div>\
                    <span>Connector Address</span>\
                  </div>\
                </th>\
                <th class="col-connectoraddress">\
                  <div>\
                    <span>Live</span>\
                  </div>\
                </th>\
              </tr>\
            </thead>\
            <tbody>\
      ']

    $.map(routeStatus, function (route) {
      connectorHtmlArray.push('    \
        <tr class="rank-undefined">\
          <td class="col-connectoraddress">\
          ' + route.route + '\
          </td>\
          <td class="col-connectorlive">\
          ' + route.live + '\
          </td>\
        </tr>\
        ')
    })

    connectorHtmlArray.push('\
          </tbody>\
        </tbody>\
      </div>')

    connectorHtml = connectorHtmlArray.join('')

    var root = $('.content')

    $(connectorHtml).appendTo(root)
    $('html').addClass('content-ready')

    nav(root)
  })
  
})

