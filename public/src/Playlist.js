import React from 'react';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/Paper';
import {AddCircle} from '@material-ui/icons';
import { Button, IconButton } from '@material-ui/core';

import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from '@material-ui/pickers';


import {getPlaylistData, sendPlaylistData, sendScheduleData} from './ApiConnection';


const useStyles = theme => ({
  item: {
    textAlign: "left",
    position: "relative",
    padding: 10,
  },
  title:{
      fontSize: '1em'
  },
  author:{
      fontSize: '0.8em',
  },
  selectPaper:{
    margin: 15,
    padding: 5,
    textAlign: "left"
  },
  texts:{
    display: 'inline-block',
    maxWidth: "calc(100% - 50px)"
  },
  root:{
    margin: "20px 0 20px 0"
  },
  schPaper:{
    padding: 5,
    margin:"0 15px 0 15px",
  },
  schTime:{
    display: 'insline-block',
    color: 'gray',
    fontSize: '10pt',
  },
  beginTime:{
    position: "absolute",
    right: "1.5em",
    top: "1.1em",
    fontSize: '0.8em'
  },
  endTime:{
    position: "absolute",
    right: "1.5em",
    bottom: "1.1em",
    fontSize: '0.8em'
  }

});



class Playlist extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      playlist: {amplifier: {day:[], enabledTimes:[]},playlist:[]}, 
      date:new Date(),
    };
  }
  componentDidMount(){
    this.updateData();
  }
  updateData = ()=>{
    getPlaylistData(this.state.date, (res)=>{
      this.setState({playlist:res});
    });
  }
  handleDateChange(newDate){
    this.setState({date:newDate}, ()=>{
      this.updateData();
    });
  }
  countEndTime(begin, length){
    var d = new Date(begin*1000+length*1000);
    return d;
  }
  formatTime(time){
    if(time.hasOwnProperty("hour") && time.hasOwnProperty("minutes")){
      var str = "";
      if(time.hour < 10) str+="0"+time.hour;
      else str+= time.hour;
      str+=":";
      if(time.minutes < 10) str+="0"+time.minutes;
      else str+= time.minutes;
      return str;
    }
    if(typeof(time)==="number")
      time = new Date(time*1000);
    return time.toLocaleTimeString()
  }
  render(){
    const {classes} = this.props;
    const schedule = this.state.playlist.amplifier.day[this.state.date.getDay()] ? this.state.playlist.amplifier.enabledTimes : [];
    const playlist = this.state.playlist.playlist;
    for(var i = 0; i < schedule.length; i++)
      schedule[i].songs = [];
    var schInd = 0;
    playlist.map((song)=>{
      var b = new Date(song.date*1000);
      b.hour = b.getHours(); b.minutes = b.getMinutes();
      var actE = schedule[schInd].end;
      while(b.hour > actE.hour || (b.hour==actE.hour && b.minutes > actE.minutes)){
        schInd++;actE = schedule[schInd].end;
      }
      if(schInd < schedule.length) schedule[schInd].songs.push(song);
    });

    return (
      <div className="Playlist">
          <Paper className={classes.selectPaper}>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <KeyboardDatePicker
                margin="normal"
                id="date-picker-dialog"
                label="Date"
                format="MM/dd/yyyy"
                value={this.state.date}
                onChange={(d)=>this.handleDateChange(d)}
                KeyboardButtonProps={{
                  'aria-label': 'change date',
                }}
              />
            </MuiPickersUtilsProvider>
            
            <Button variant="contained" color="primary" onClick={this.props.scheduleMenuSwitch}>
              Schedule
            </Button>
          </Paper>
          
          {schedule.map((time,ind) => (
            <div key={ind} className={classes.root}>
            <Typography component="p" className={classes.schTime}>
              {this.formatTime(time.begin)}
            </Typography>
              <Paper className={classes.schPaper}>
                <IconButton>
                  <AddCircle/>
                </IconButton>
                {time.songs.map(song => (//TODO addButtons!
                  <ListItem key={song.id} className={classes.item}>
                    <div className={classes.texts}>
                        <Typography variant="h5" component="h3" className={classes.title}>
                        {song.name}
                        </Typography>
                        <Typography component="p" className={classes.author}>
                        {song.author}
                        </Typography>
                    </div>
                    <Typography component="p" className={classes.beginTime}>
                      {this.formatTime(song.date)}
                    </Typography>
                    <Typography component="p" className={classes.endTime}>
                      {this.formatTime(this.countEndTime(song.date,song.length))}
                    </Typography>
                  </ListItem>
              ))}
              </Paper>
            <Typography component="p" className={classes.schTime}>
              {this.formatTime(time.end)}
            </Typography>
            </div>
          ))}
      </div>
    );
  }
}
Playlist.propTypes = {
  classes: PropTypes.object.isRequired,
};
export default withStyles(useStyles)(Playlist);