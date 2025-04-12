import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import './App.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aulztkvhnsqkytzvkbhb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bHp0a3ZobnNxa3l0enZrYmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NDgwOTIsImV4cCI6MjA1NjQyNDA5Mn0.U7_jlTdyU39nqAxrDalr2QWRsPpktdtIXtu9ur-_gI0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [currentDay, setCurrentDay] = useState('');
  const [activities, setActivities] = useState([]);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const [editing, setEditing] = useState({ id: null, field: null });
  const [newWeekday, setNewWeekday] = useState('segunda');
  const [newHorario, setNewHorario] = useState('');
  const [newAtividade, setNewAtividade] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let hours12 = hours % 12 || 12;
    const ampm = hours < 12 ? "AM" : "PM";
    return `${hours12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    document.body.classList.toggle('dark-theme', isDarkTheme);
  }, [isDarkTheme]);

  useEffect(() => {
    const handleScroll = () => {
      const progressContainer = document.getElementById('progressContainer');
      const scrollPosition = window.scrollY || window.pageYOffset;
      const headerHeight = document.querySelector('header').offsetHeight;

      if (progressContainer && headerHeight && scrollPosition > headerHeight) {
        progressContainer.classList.add('fixed');
      } else if (progressContainer) {
        progressContainer.classList.remove('fixed');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadDayActivities = async (weekday) => {
    if (!weekday) return;
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('weekday', weekday)
        .order('horario', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
      setActivities([]);
    }
  };

  const updateDayTitle = (day) => {
    const dayTitle = document.getElementById('dayTitle');
    if (dayTitle && day) {
      dayTitle.textContent = `Rotina de ${capitalizeFirstLetter(day)}`;
    } else if (dayTitle) {
      dayTitle.textContent = 'Selecione um dia';
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const updateActivity = async (id, updatedFields) => {
    if (!currentDay) return;
    try {
      const { error } = await supabase
        .from('activities')
        .update(updatedFields)
        .eq('id', id);

      if (error) throw error;
      await loadDayActivities(currentDay);
      setEditing({ id: null, field: null });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const deleteActivity = async (id) => {
    if (!currentDay) return;
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadDayActivities(currentDay);
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const updateStatus = async (status, index) => {
    if (!currentDay || !activities[index]) return;
    const activityId = activities[index].id;
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status })
        .eq('id', activityId);

      if (error) throw error;
      await loadDayActivities(currentDay);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const clearStatus = async () => {
    if (!currentDay) return;
    try {
      const { data: activitiesToClear, error: fetchError } = await supabase
        .from('activities')
        .select('id')
        .eq('weekday', currentDay);

      if (fetchError) throw fetchError;
      if (!activitiesToClear || activitiesToClear.length === 0) return;

      const idsToClear = activitiesToClear.map(a => a.id);

      const { error: updateError } = await supabase
        .from('activities')
        .update({ status: '' })
        .in('id', idsToClear);

      if (updateError) throw updateError;
      await loadDayActivities(currentDay);
    } catch (error) {
      console.error('Error clearing status:', error);
    }
  };

  const addActivity = async () => {
    if (!newAtividade || !newHorario || isAddingActivity) return;

    setIsAddingActivity(true);
    let generatedEmoji = '⏳';

    try {
      const apiKey = 'sk-f73d2deda9934e44beb38cc99c08c6d0';
      const prompt = `Suggest a single emoji that represents the activity: "${newAtividade}". The emoji should be related to ${newAtividade}. Respond only with the emoji.`;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          'model': 'deepseek-chat',
          'messages': [
            { 'role': 'system', 'content': 'You are a helpful assistant that provides a single emoji suggestion.' },
            { 'role': 'user', 'content': prompt }
          ],
          'stream': false
        })
      });

      const data = await response.json();

      if (data.choices && data.choices.length > 0) {
        generatedEmoji = data.choices[0].message.content.trim();
        if (!/\p{Emoji}/u.test(generatedEmoji)) {
          generatedEmoji = '📝';
        }
      } else {
        generatedEmoji = '⚠️';
      }
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      generatedEmoji = '⚠️';
    }

    try {
      const { error } = await supabase
        .from('activities')
        .insert([{
          weekday: newWeekday,
          horario: newHorario,
          emoji: generatedEmoji,
          atividade: newAtividade,
          status: ''
        }]);

      if (error) throw error;
      await loadDayActivities(currentDay || newWeekday);

      setNewHorario('');
      setNewAtividade('');
    } catch (error) {
      console.error('Error adding activity to Supabase:', error);
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleAddActivitySubmit = (e) => {
    e.preventDefault();
    addActivity();
  };

  const handleDayClick = (day) => {
    setCurrentDay(day);
    loadDayActivities(day);
    updateDayTitle(day);
  };

  const handleClearClick = () => {
    if (currentDay) {
      if (window.confirm('Tem certeza de que deseja limpar todos os status para este dia?')) {
        clearStatus();
      }
    } else {
      alert('Por favor, selecione um dia primeiro.');
    }
  };

  const handleResetClick = () => {
    const senha = prompt('Por favor, insira a senha para recarregar a página (não reseta dados do Supabase):');
    if (senha === '123') {
      window.location.reload();
    } else {
      alert('Senha incorreta. Ação cancelada.');
    }
  };

  const calculateProgress = () => {
    if (!activities || activities.length === 0) return 0;
    const total = activities.length;
    const done = activities.filter(item => item.status === 'feito').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const progress = calculateProgress();

  const handleCellClick = (id, field) => {
    if (id) {
      setEditing({ id, field });
    }
  };

  const handleInputChange = (e, id, field) => {
    setActivities(activities.map(activity => {
      if (activity.id === id) {
        return { ...activity, [field]: e.target.value };
      }
      return activity;
    }));
  };

  const handleInputCommit = async (e, id, field) => {
    if (e.type === 'blur' || (e.type === 'keypress' && e.key === 'Enter')) {
      e.preventDefault();
      if (editing.id === id && editing.field === field) {
        const activityToUpdate = activities.find(act => act.id === id);
        if (activityToUpdate) {
          await updateActivity(id, { [field]: activityToUpdate[field] });
        }
      }
      if (e.target) e.target.blur();
      setEditing({ id: null, field: null });
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Quadro de Rotina Diária: José</h1>
        <div id="themeSwitchContainer">
          <div className="switch__container">
            <input id="themeSwitch" className="switch switch--shadow" type="checkbox" checked={isDarkTheme} onChange={() => setIsDarkTheme(!isDarkTheme)} />
            <label htmlFor="themeSwitch"></label>
          </div>
        </div>
      </header>

      {/* --- Activity Creation Form --- */}
      <form onSubmit={handleAddActivitySubmit} className='form-add'>
        <label htmlFor="newWeekday">Dia:</label>
        <select id="newWeekday" value={newWeekday} onChange={(e) => setNewWeekday(e.target.value)} disabled={isAddingActivity}>
          <option value="segunda">Segunda</option>
          <option value="terca">Terça</option>
          <option value="quarta">Quarta</option>
          <option value="quinta">Quinta</option>
          <option value="sexta">Sexta</option>
          <option value="sabado">Sábado</option>
          <option value="domingo">Domingo</option>
        </select>

        <label htmlFor="newHorario">Horário:</label>
        <input
          type="time"
          id="newHorario"
          value={newHorario}
          onChange={(e) => setNewHorario(e.target.value)}
          required
          disabled={isAddingActivity}
        />



        <label htmlFor="newAtividade">Atividade:</label>
        <input
          type="text"
          id="newAtividade"
          value={newAtividade}
          onChange={(e) => setNewAtividade(e.target.value)}
          required
          disabled={isAddingActivity}
        />

        <button type="submit" disabled={isAddingActivity}>
          {isAddingActivity ? 'Adicionando...' : 'Cadastrar'}
        </button>
      </form>

      {/* --- Day Selection Buttons --- */}
      <div id="dayButtons">
        {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map(day => (
          <button
            key={day}
            className={`day-button ${currentDay === day ? 'active' : ''}`}
            data-day={day}
            onClick={() => handleDayClick(day)}
          >
            {capitalizeFirstLetter(day)}
          </button>
        ))}
      </div>

      <div id="buttonContainer">
        <button id="clearButton" onClick={handleClearClick} disabled={!currentDay}>🧹 Limpar Status</button>
        <button id="resetButton" onClick={handleResetClick}>🔄 Recarregar</button>
        <a href="report.html" id="reportLink">
          <button id="reportButton">📊 Relatório Semanal</button>
        </a>
      </div>

      <h2 id="dayTitle">Selecione um dia</h2>

      <div id="progressContainer" style={{ visibility: currentDay ? 'visible' : 'hidden' }}>
        <progress id="progressBar" value={progress} max="100"></progress>
        <span id="progressText">{progress}% concluído</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Feito</th>
            <th>Não Feito</th>
            <th>Horário</th>
            <th>Emoji</th>
            <th>Atividade</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {!currentDay && (
            <tr><td colSpan="6">Por favor, selecione um dia para ver as atividades.</td></tr>
          )}
          {currentDay && activities.length === 0 && (
            <tr><td colSpan="6">Nenhuma atividade cadastrada para {currentDay}.</td></tr>
          )}

          {currentDay && activities.map((item, index) => (
            <tr key={item.id || index} className={item.status === 'feito' ? 'feito' : item.status === 'nao-feito' ? 'nao-feito' : ''}>
              <td>
                <input type="radio" id={`feito-${item.id}`} name={`status-${item.id}`} className="feito" checked={item.status === 'feito'} onChange={() => updateStatus('feito', index)} />
                <label htmlFor={`feito-${item.id}`} className="status-label"></label>
              </td>
              <td>
                <input type="radio" id={`nao-feito-${item.id}`} name={`status-${item.id}`} className="nao-feito" checked={item.status === 'nao-feito'} onChange={() => updateStatus('nao-feito', index)} />
                <label htmlFor={`nao-feito-${item.id}`} className="status-label"></label>
              </td>

              <td className="editable" onClick={() => handleCellClick(item.id, 'horario')}>
                {editing.id === item.id && editing.field === 'horario' ? (
                  <input
                    type="time"
                    value={item.horario}
                    onChange={(e) => handleInputChange(e, item.id, 'horario')}
                    onBlur={(e) => handleInputCommit(e, item.id, 'horario')}
                    onKeyPress={(e) => handleInputCommit(e, item.id, 'horario')}
                    autoFocus
                  />
                ) : (
                  formatTime(item.horario) || 'N/A'  // Use formatTime here
                )}
              </td>

              <td className="emoji">
                {item.emoji}
              </td>

              <td className="atividade editable" onClick={() => handleCellClick(item.id, 'atividade')}>
                {editing.id === item.id && editing.field === 'atividade' ? (
                  <input
                    type="text"
                    value={item.atividade}
                    onChange={(e) => handleInputChange(e, item.id, 'atividade')}
                    onBlur={(e) => handleInputCommit(e, item.id, 'atividade')}
                    onKeyPress={(e) => handleInputCommit(e, item.id, 'atividade')}
                    autoFocus
                  />
                ) : (
                  item.atividade
                )}
              </td>

              <td>
                <button className='delete-button' onClick={() => deleteActivity(item.id)} title="Excluir atividade">
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
