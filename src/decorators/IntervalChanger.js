import React, { Component } from 'react';
import {changeScheduleValue} from '../AC';
import {connect} from 'react-redux';

export default Interval => connect(state=>({schedule:state.schedule}),{changeScheduleValue})(class IntervalChanger extends Component{
  constructor(props){
    super(props)
    
    this.state = {
      type:{
        0:'Начало смены',
        1:'Конец смены',
        2:'Полная смена',
        3:'Интервал'
      }
    }

  }
  render(){
    console.log('----',this.state);
    return <Interval  {...this.state} 
                      {...this.props} 
                      setHours = {this.setHours}
                      setRangeValue = {this.setRangeValue}
            />
  }

  setHours(value){
    let h = (parseInt(value,10) *5) / 60 < 1 ? 0 : Math.floor((value*5)/60);
    let m = ((parseInt(value,10) *5) % 60) < 10 ? '0' +  (parseInt(value,10) *5) % 60 : (parseInt(value,10) *5) % 60;
    return `${h}:${m}`
  }

  setRangeValue = intervalValue =>{
    if(typeof intervalValue !== 'undefined'){
      return [intervalValue.begin,intervalValue.end]
    }
  }

})