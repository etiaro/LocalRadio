const not = {
  instance: null,
  get getInstance() {
    if (!this.instance) {
      this.instance = {
        singletonMethod() { return 'singletonMethod2'; },
        type: 'NoClassSingleton1',
        get getType() { return this.type; },
        set getType(value) { this.type = value; },
      };
    }
    return this.instance;
  },
};
export default not; // singleton stuff, don't care about it

export const notification = Object.assign({}, {
  singletonMethod() {
    return 'singletonMethod2';
  },
  notID: 0,
  type: 'NotificationController',
  get getType() {
    return this.type;
  },
  set getTpye(value) {
    this.type = value;
  },

  listeners: {},
  addListener(res, id, isAdmin) {
    this.listeners[id] = {
      send: (data) => {
        res.status(200).send(data);
      },
      sent: 0,
      isAdmin,
    };
  },
  sendTo(data, id) {
    const sendID = id;
    setTimeout(() => {
      if (!(notification.listeners[sendID])) return;
      if (notification.listeners[sendID].sent >= 50) {
        delete notification.listeners[sendID];
        return;
      }
      if (notification.listeners[sendID].sent !== 0) {
        notification.listeners[sendID].sent += 1;
        this.sendTo(data, id);
      } else {
        try {
          notification.listeners[sendID].sent = 1;
          notification.listeners[sendID].send(data);
        } catch (e) {
          console.log(e);
        }
      }
    }, 200);
  },
  notify(data, adminOnly) {
    this.notID += 1;
    // eslint-disable-next-line no-param-reassign
    data.notID = this.notID;
    this.notID %= 200000009;
    Object.keys(this.listeners).forEach((id) => {
      if ((adminOnly && this.listeners[id].isAdmin) || !adminOnly) { this.sendTo(data, id); }
    });
  },
});
