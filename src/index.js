import React, {useState, useCallback} from 'react'
import {render} from 'react-dom'
import {BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'
import {Provider} from 'react-redux'
import store from './store'
import 'antd/dist/antd.css'
import {Menu} from 'antd'
import {MailOutlined, AppstoreOutlined, SettingOutlined} from '@ant-design/icons'

import Home from './page/home/index'
import LibrarySubscribe from './page/library-subscribe/index'
import LibraryRuleList from './page/library-rule-list/index'

const {SubMenu} = Menu

const routes = [
  {
    path: '/',
    component: Home,
  },
]

function Root() {
  const [current, setCurrent] = useState('home')
  const handleClick = useCallback((e) => {
    setCurrent(e.key)
  })

  return (
    <>
      <Provider store={store}>
        <Router>
          <Menu onClick={handleClick} selectedKeys={[current]} mode='horizontal'>
            <Menu.Item key='home' icon={<MailOutlined />}>
              <Link to='/'>Home</Link>
            </Menu.Item>

            <SubMenu icon={<SettingOutlined />} title='资源管理'>
              <Menu.Item key='library:subscribe'>
                <Link to='/library/subscribe'>订阅管理</Link>
              </Menu.Item>
              <Menu.Item key='library:rule-list'>
                <Link to='/library/rule-list'>规则列表管理</Link>
              </Menu.Item>
            </SubMenu>

            <Menu.Item key='alipay'>
              <a href='https://ant.design' target='_blank' rel='noopener noreferrer'>
                Navigation Four - Link
              </a>
            </Menu.Item>
          </Menu>

          {/* A <Switch> looks through its children <Route>s and renders the first one that matches the current URL. */}
          <div>
            <Switch>
              <Route exact path='/' component={Home}></Route>
              <Route exact path='/library/subscribe' component={LibrarySubscribe}></Route>
              <Route exact path='/library/rule-list' component={LibraryRuleList}></Route>
            </Switch>
          </div>
        </Router>
      </Provider>
    </>
  )
}

render(<Root />, window.app)
