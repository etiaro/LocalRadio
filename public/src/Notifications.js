import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  container:{
    position:'fixed',
    right: 0,
    top: 0,
    padding: 10,
  },
  root:{
    margin: 15,
    padding: 15,
    width: '20em',
    height: '3em',
    overflow: 'hidden'
  },
  text:{
      fontSize: '1em'
  }
}));


export default function Notifications(props) {
    const classes = useStyles();
    var i = 0;
    return (
        <div className={classes.container}>
            {props.notifications.map(note => (
            <Paper key={i++} className={classes.root}>
                <Typography component="p" className={classes.text}>
                {note.msg}
                </Typography>
            </Paper>
            ))}
        </div>
    );
}