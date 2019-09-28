const not = {_instance: null, get instance() { if (!this._instance) {this._instance = { singletonMethod() {return 'singletonMethod2';},_type: 'NoClassSingleton1', get type() { return this._type;},set type(value) {this._type = value;}};}return this._instance; }};
export default not;  //singleton stuff, don't care about it


export const notification = Object.assign({}, {
    singletonMethod() {
      return 'singletonMethod2';
    },
    _type: 'NotificationController',
    get type() {
      return this._type;
    },
    set type(value) {
      this._type = value;
    },

    listeners: [],
    addListener(res){
        this.listeners.push((data)=>{
            res.status(200).send(data);
        });
    },
    notify(data){
        for(let i = 0; i < this.listeners.length; i++){
            try{
                this.listeners[i](data);
            }catch(e){
                console.log('listener disconnected ', e);
            }
            this.listeners.splice(i,1);
            i--;
        }
    }
});