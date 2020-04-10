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
        return [
            { urls: `stun:${location.hostname}:19302`},
           // { urls: 'stun:stun.l.google.com:19302' },
           // { urls: 'stun:stun.sipgate.net:3478' }
        ]
    }

    async function loadGame() {
        const user = elFormName.value;
        const data = {
            [user]: { x: 0, y: 0, el: createPoint(user) },
        };

        const root = Gun({
            peers: [`${location.origin}/gun`],
            rtc: { iceServers: await getICEServers() },
        });

        let sendPosition = () => {};

        if (localStorage.getItem('dam')) {
            const dam = root.back('opt.mesh');
            dam.hear.GameData = (msg, peer) => {
                const { name, x, y } = msg;
                updateData(name, x, y);
            };
            sendPosition = (x, y) => {
                dam.say({ dam: 'GameData', name: user, x, y });
            };
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
