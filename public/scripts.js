document.addEventListener('DOMContentLoaded', () => {
    const elPageUser = document.getElementById('page-user');
    const elFormUser = document.getElementById('form-user');
    const elFormName = document.getElementById('form-user-name');
    const elPageGame = document.getElementById('page-game');

    elFormUser.addEventListener('submit', e => {
        e.preventDefault();
        gotoGame();
        loadGame();
    });

    function gotoGame() {
        elPageUser.style.display = 'none';
        elPageGame.style.display = 'block';
    }

    async function getICEServers() {
        var servers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun.sipgate.net:3478' }
           // { urls:  `stun:${location.hostname}:80`}
        ];
        console.log('self stun',servers);
        return servers;
    }

    async function loadGame() {
        const user = elFormName.value;
        const data = {
            [user]: { x: 0, y: 0, el: createPoint(user) },
        };
      
        try {
           var streaming = false;
           var video = document.getElementById('video');
           navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
            })
            .catch(function(err) {
                console.log("An error occurred: " + err);
            });
            video.addEventListener('canplay', function(ev){
            if (!streaming) {
              var width = 400;
              var height = video.videoHeight / (video.videoWidth/width);
              video.setAttribute('width', width);
              video.setAttribute('height', height);
              streaming = true;
            }
            }, false);
          
            var canvas = document.getElementById('canvas');
            var startbutton = document.getElementById('startbutton');
            startbutton.addEventListener('click', function(ev){
              ev.preventDefault();
              var context = canvas.getContext('2d');
              if (context) {
                canvas.width = video.width;
                canvas.height = video.height;
                context.drawImage(video, 0, 0, video.width, video.height);
                var data = canvas.toDataURL('image/png');
                sendFrame(data);
              }
            })

          
        } catch(e){
          console.log(e)
        }
      
        const root = Gun({
            peers: [`${location.origin}/gun`],
            rtc: { iceServers: await getICEServers() },
        });

        let sendPosition = () => {};
        let sendFrame = () => {};

        if (localStorage.getItem('dam')) {
            const dam = root.back('opt.mesh');
            dam.hear.GameData = (msg, peer) => {
                const { name, x, y } = msg;
                updateData(name, x, y);
            };
             dam.hear.Image = (msg, peer) => {
                const { image } = msg;
                console.log('got image!');
                var canvas = document.getElementById('canvas');
                canvas.drawImage(image, 0,0);
            };
            sendPosition = (x, y) => {
                dam.say({ dam: 'GameData', name: user, x, y });
            };
            sendFrame = (image) => {
                damn.say({ dam: 'Image', image })
            }
        } else {
            root.on('in', function (msg) {
                if (msg.cgx) {
                    const { name, x, y } = msg.cgx;
                    updateData(name, x, y);
                }
                this.to.next(msg);
            });
            sendPosition = (x, y) => {
                const id = Math.random().toString().slice(2);
                root.on( 'out', { '#': id, cgx: { name: user, x, y }});
            };
        }

        function updateData(name, x, y) {
            if (!data[name]) {
                data[name] = { x, y, el: createPoint(name) };
            } else {
                data[name].x = x;
                data[name].y = y;
            }
        }

        function createPoint(name) {
            const point = document.createElement('div');
            point.className = 'point';
            const text = document.createElement('span');
            text.className = 'point-text';
            text.innerText = name;
            point.appendChild(text);
            elPageGame.appendChild(point);
            return point;
        }

        function render() {
            for (const name of Object.keys(data)) {
                const { el, x, y } = data[name];
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
            }
        }
        function schedule() {
            requestAnimationFrame(() => {
                render();
                schedule();
            });
        }
        schedule();

        elPageGame.addEventListener('mousemove', e => {
            data[user].x = e.x;
            data[user].y = e.y;
            //console.log('sending mouse',e.x,e.y);
            sendPosition(e.x, e.y);
        });
    }
});
