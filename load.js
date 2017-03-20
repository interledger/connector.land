function load() {
  var tab = 'hosts';
  if (window.location.hash === '#ledgers') {
    tab = 'ledgers';
  }
  if (window.location.hash === '#connectors') {
    tab = 'connectors';
  }
  $('#header-row').html('<th>Loading ...</th>');
  $('#nodes-list').html('<tr><td>Loading ...</td></tr>');
  console.log('loading', tab);
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open('GET', `https://stats.connector.land/?tab=${tab}`, true);
  xhr.onload = function() {
    ['hosts', 'ledgers', 'connectors'].map(tabName => {
      if (tab === tabName) {
        $(`#nav-${tabName}`).addClass('active');
      } else {
        $(`#nav-${tabName}`).removeClass('active');
      }
    });
    $('#header-row').html(xhr.response[tab].headers.join('\n'));
    $('#nodes-list').html(xhr.response[tab].rows.join('\n'));
  };
  xhr.send();
}

// works in all browsers except Opera Mini:
window.onhashchange = load;

load();
