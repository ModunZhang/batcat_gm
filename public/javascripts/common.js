/**
 * Created by modun on 15/8/18.
 */
$('.selectpicker').selectpicker();
$(function(){
  $('#gameSelector li a').click(function(event){
    event.preventDefault();
    var $target = $(event.target);
    var gameId = $target.attr('gameId');
    var gameName = $target.attr('gameName');
    var isActive = $target.parent().attr('class') === 'active';
    if(isActive) return;
    $.get('/user/set-default-game', {}, function(data, status){
      if(status !== 'success') return;
      var token = data.token;
      $.post('/user/set-default-game',
        {
          gameId:gameId,
          _method:'PUT',
          _csrf:token
        },
        function(data,status){
          if(status !== 'success' || !data.code || data.code !== 200) return;
          location.reload();
        });
    });
  })
});