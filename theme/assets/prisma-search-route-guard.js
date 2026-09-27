(function () {
  if (window.location.pathname.replace(/\/$/, '') !== '/search') return;

  var params = new URLSearchParams(window.location.search || '');
  var query = String(params.get('q') || '').trim().toLowerCase();
  var routes = {
    'english cards': '/collections/english-card-boxes',
    'english card': '/collections/english-card-boxes',
    'chinese cards': '/collections/cn-trading-card-boxes',
    'chinese card': '/collections/cn-trading-card-boxes',
    'cn cards': '/collections/cn-trading-card-boxes',
    'cn card': '/collections/cn-trading-card-boxes',
    'tcg': '/collections/tcg-card-boxes',
    'tcg cards': '/collections/tcg-card-boxes',
    'tcg card': '/collections/tcg-card-boxes',
    'trading card game': '/collections/tcg-card-boxes',
    'ccg': '/collections/ccg-card-boxes',
    'ccg cards': '/collections/ccg-card-boxes',
    'ccg card': '/collections/ccg-card-boxes',
    'collectible card game': '/collections/ccg-card-boxes'
  };

  if (routes[query]) {
    window.location.replace(routes[query]);
  }
})();
