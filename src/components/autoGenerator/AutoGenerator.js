import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { changeScheduleValueSimple,changeScheduleValueComplex,addMsgToTerminal} from '../../AC';
import { findDOMNode } from 'react-dom';

import ModalTerminal from '../ModalTerminal';
import * as launcher  from '../../lib/api/launcher';
import {deleteDataAfterComplete} from '../../lib/api/launcher';
import ScheduleConfig from '../ScheduleConfig';

class AutoGenerator extends Component {
  
  static PropTypes = {
    //from store ?
    schedule:PropTypes.object.isRequired,
    terminal:PropTypes.object.isRequired,
    //from MAinPage
    server:PropTypes.string.isRequired
  }

  state = {
    open:false
  }

  render() {
    //console.log("AUTO",this.props);
    return(
      <form>
        <div className = 'form-row'>
          <div className="form-group col-md-3">
            <label>Дата начала генерации</label>
            <input type='date' className='form-control' value = {this.props.schedule.beginDate} onChange={this.changeValue('beginDate')}/>
          </div>
          <div className="form-group col-md-3">
            <label>Дата конца генерации</label>
            <input type='date' className='form-control' value = {this.props.schedule.endDate} onChange = {this.changeValue('endDate')}/>
          </div>
          <div className="form-group col-md-3">
            <label>Тип графика</label>
            <select className='form-control' onChange = {this.changeValue('scheduleType')} value = {this.props.schedule.scheduleType}>
              <option value='Недельный'>Недельный</option>
              <option value='Сменный' selected>Сменный</option>
              <option value='По присутствию'>По присутствию</option>
            </select>
          </div>
          <div>
            <label>Часов размазать</label>
            <input type='number' className='form-control' onChange = {this.changeValue('hours')} value = {this.props.schedule.hours}/>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group col-md-3">
            <label>Автоматическое удаление данных</label>
            <input type='checkbox' className='form-control col-1' value="false" onChange={this.changeRemoveAfterComplete}/>
          </div>
          <div className="form-group col-md-3">
            <button type='button' className='btn btn-primary' onClick={this.deleteMiddleMethodData}>Удалить в ручную</button>
          </div>
        </div>
        <hr style = {{'border': 'none','background-color':'rgb(230, 230, 230)','color': 'red','height': '2px'}}/>
          <ScheduleConfig changeValue = {this.changeValue} type = {this.props.schedule.scheduleType}/>
          <button type='button' className='btn btn-primary' onClick = {this.onSubmit}>Генерация</button>
          <ModalTerminal terminal = {this.props.terminal} open = {this.state.open} closeModal = {this.closeModal}/>
      </form>
    )
  }

  closeModal = () =>{
    this.setState({
      open:false
    })
  }

  //отдельная ф-ия для чекера
  changeRemoveAfterComplete = () =>{
    const {changeScheduleValueSimple} = this.props;
    let {removeDataAfterComplete} = this.props.schedule;
    removeDataAfterComplete === true ? changeScheduleValueSimple({'removeDataAfterComplete':false}) : changeScheduleValueSimple({'removeDataAfterComplete':true});
  }

  changeValue = (field,option) => e =>{
    let obj = {}
    const {changeScheduleValueSimple} = this.props;
    const {changeScheduleValueComplex} = this.props;
    if(typeof option === 'undefined'){
      obj[field] = e.target.value;
      changeScheduleValueSimple(obj);
    }
    else{
      obj[field] = { [`${option}`] : e.target.value};
      changeScheduleValueComplex(obj)
    }
  }

  setRef = ref =>{
    return findDOMNode(ref)
  }

  deleteMiddleMethodData = async () =>{
    const {idsMap} = this.props.schedule;
    const {addMsgToTerminal} = this.props;
    const {server} = this.props;
    await deleteDataAfterComplete(idsMap,server).then(result=>{
      addMsgToTerminal(result);
      this.setState({open:true});
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });
  }

  onSubmit = async() => {
    const {changeScheduleValueSimple} = this.props;
    const {schedule} = this.props;
    const {addMsgToTerminal} = this.props;
    const {removeDataAfterComplete} = this.props.schedule;
    const {server} = this.props;
    let monthlyLauncher = launcher.monthlyLauncher(schedule,server);

    //Проверка формата даты
    await monthlyLauncher.checkDates().then(result=>{
      addMsgToTerminal(result);
      this.setState({open:true});
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });

    //Проверка максимально возможного колличества рабочих часов в заданом интервале
    await monthlyLauncher.checkAverageWeekHours().then(result=>{
      addMsgToTerminal(result);
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });
    
    //Формирование списка зависимых методов для генерации событий прохода
    await monthlyLauncher.dependenciesListForming().then(result=>{
      addMsgToTerminal(result);
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });

    // Добавляем айдишники и др данные в зависимые методы
    await monthlyLauncher.addMethodsData().then(result=>{
      addMsgToTerminal(result);
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });

    //Добавляем график (только после добавления данных в зависимые методы ибо добавляется access_zone)
    await monthlyLauncher.addSchedule().then(result=>{
      addMsgToTerminal(result);
    }).catch(reason=>{
      addMsgToTerminal(reason)
      this.setState({open:true});
      throw new Error();
    });

    //Генерируем события
    await monthlyLauncher.addEvent().then(result=>{
      addMsgToTerminal(result)
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });

    let idsMap = await monthlyLauncher.getIds();
    if(removeDataAfterComplete == true){
      await deleteDataAfterComplete(idsMap,server).then(result=>{
        addMsgToTerminal(result);
      }).catch(reason=>{
        addMsgToTerminal(reason);
        this.setState({open:true});
        throw new Error();
      });
    }
    else{
      changeScheduleValueSimple({'idsMap':idsMap});
    }

    //Запуск ОРВ
    /*
    await monthlyLauncher.timeTracking().then(result=>{
      addMsgToTerminal(result);
    }).catch(reason=>{
      addMsgToTerminal(reason);
      this.setState({open:true});
      throw new Error();
    });
    */
   
    // Показываем результат
    this.setState({
      open:true
    });
  }
};

export default connect(state=>({schedule:state.schedule,terminal:state.terminal}),{changeScheduleValueSimple,changeScheduleValueComplex,addMsgToTerminal})(AutoGenerator);
