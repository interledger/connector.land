var xhr = new XMLHttpRequest();
xhr.responseType = 'json';
xhr.open('GET', 'https://stats.connector.land', true);
xhr.onload = function() {
  document.getElementById("header-row").innerHTML = xhr.response.headers.join('\n');
  document.getElementById("nodes-list").innerHTML = xhr.response.rows.join('\n');
};
xhr.send();
