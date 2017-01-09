(function(){
   var canvas = document.getElementById("canv");
   var ctx = canvas.getContext("2d");
   var signed = false;

   var trackMouseDown = canvas.addEventListener("mousedown", pointerDown, false);
   canvas.addEventListener("mouseup", pointerUp, false);

   function pointerDown(evt) {
      ctx.beginPath();
      ctx.moveTo(evt.offsetX, evt.offsetY);
      canvas.addEventListener("mousemove", paint, false);
   }

   function pointerUp(evt) {
      canvas.removeEventListener("mousemove", paint);
      paint(evt);
      document.getElementById('hiddenInput').value = canvas.toDataURL();
   }

   function paint(evt) {
      ctx.lineTo(evt.offsetX, evt.offsetY);
      ctx.stroke();
   }

   document.getElementById('clearButton').addEventListener('click', function(){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
   });
})();
