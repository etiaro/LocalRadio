const not = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod2';},_type: 'NoClassSingleton1', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default not;  //singleton stuff, don't care about it


export const notification = Object.assign({}, {
    singletonMethod() {
      return 'singletonMethod2';
    },
    notID: 0,
    _type: 'NotificationController',
    get type() {
      return this._type;
    },
    set type(value) {
      this._type = value;
    },

    listeners: {},
    addListener(res, id){
        this.listeners[id] = {
            send: (data)=>{
                    res.status(200).send(data);
                  },
            sent: 0
        }
    },
    sendTo(data, id){
        const sendID = id;
        setTimeout(()=>{
            if(!(notification.listeners[sendID]))
                return;
            if(notification.listeners[sendID].sent >= 50){
                delete notification.listeners[sendID];
                return;
            }
            if(notification.listeners[sendID].sent != 0){
                notification.listeners[sendID].sent++;
                this.sendTo(data, id);
            }else
                try{
                    notification.listeners[sendID].sent = 1;
                    notification.listeners[sendID].send(data);
                }catch(e){
                }
        }, 200);
    },
    notify(data){
        data.notID = this.notID++;
        for(let id in this.listeners)
            this.sendTo(data, id);
    }
});