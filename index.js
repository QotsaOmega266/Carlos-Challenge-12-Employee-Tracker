const inquirer = require('inquirer');
const mysql = require('mysql2');


const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12347$$jag',
    database: 'employee_manager_db'
});


connection.connect((err) => {
    if (err) throw err
    console.log('connected to MySQL server!')
    showPrompt();
});


// inquirer prompts

const showPrompt = () => {
    inquirer.prompt([
        {
            type: 'list',
            name: 'mainMenu',
            message: 'What would you like to do?',
            choices: [
                'View all departments',
                'View all roles',
                'View all employees',
                'Add a department',
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'Quit'
            ]
        }
    ]).then((answer) => {
        switch (answer.mainMenu) {
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'Add a department':
                addDepartment();
                break;
            case 'Add a role':
                addRole();
                break;
            case 'Add an employee':
                addEmployee();
                break;
            case 'Update an employee role':
                updateEmployeeRole();
                break;
            case 'Quit':
                connection.end();
                break;
            default:
                console.log('An unknown error occurred');
                process.exit(1);
        }
    })
};




const viewAllDepartments = () => {
    connection.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        console.table(res);
        showPrompt();
    })
};


const viewAllRoles = () => {
    const sql = `
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    LEFT JOIN department ON role.department_id = department.id
    `;
    connection.query(sql, (err, res) => {
      if (err) throw err;
      console.table(res);
      showPrompt();
    });
};


const viewAllEmployees = () => {
    const sql = `
      SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
      FROM employee
      LEFT JOIN role ON employee.role_id = role.id
      LEFT JOIN department ON role.department_id = department.id
      LEFT JOIN employee manager ON employee.manager_id = manager.id
    `;
    connection.query(sql, (err, res) => {
      if (err) throw err;
      console.table(res);
      showPrompt();
    });
  };

const addDepartment = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'What is the name of the department?',
        }
    ]).then((answer) => {
        connection.query('INSERT INTO department SET ?', answer, (err) => {
            if (err) throw err;
            console.log('Department added successfully!');
            showPrompt();
        })
    })
};


const addRole = () => {
    connection.query('SELECT * FROM department', (err, res) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'What is the title of the role?',
            },
            {
                type: 'number',
                name: 'salary',
                message: 'What is the salary of the role?',
            },
            {
                type: 'list',
                name: 'department_id',
                message: 'Which department does this new role belong to?',
                choices: [
                    ...res.map(department => ({ name: department.name, value: department.id })),
                    { name: 'Add new department', value: 'new' }
                ],
            }
        ]).then((answer) => {
            if (answer.department_id === 'new') {
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'What is the name of the new department?',
                    }
                ]).then((departmentAnswer) => {
                    connection.query('INSERT INTO department SET ?', departmentAnswer, (err, res) => {
                        if (err) throw err;
                        console.log('Department added successfully!');
                        answer.department_id = res.insertId;
                        insertRole(answer);
                    })
                })
            } else {
                insertRole(answer);
            }
        })
    })
};

const insertRole = (answer) => {
    connection.query('INSERT INTO role SET ?', answer, (err) => {
        if (err) throw err;
        console.log('Role added successfully!');
        showPrompt();
    })
};

const addEmployee = () => {
    connection.query('SELECT * FROM role', (err, res) => {
        if (err) throw err;
        connection.query('SELECT e.id, CONCAT(e.first_name, " ", e.last_name) AS manager_name FROM employee e JOIN role r ON e.role_id = r.id', (err, managers) => {
            if (err) throw err;
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'first_name',
                    message: 'What is the first name of the employee?',
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: 'What is the last name of the employee?',
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'What is the role of the employee?',
                    choices: [
                        ...res.map(role => ({ name: role.title, value: role.id })),
                        { name: 'Add new role', value: 'new' }
                    ],
                },
                {
                    type: 'list',
                    name: 'manager_id',
                    message: 'Who is the manager of the employee?',
                    choices: [
                        { name: 'None', value: null },
                        ...managers.map(manager => ({ name: manager.manager_name, value: manager.id })),
                        { name: 'Add new manager', value: 'new' }
                    ],
                },
            ]).then((answer) => {
                if (answer.role_id === 'new') {
                    addRole();
                } else {
                    connection.query('INSERT INTO employee SET ?', answer, (err) => {
                        if (err) throw err;
                        console.log('Employee added successfully!');
                        showPrompt();
                    })
                }
            })
        })
    })
};

const updateEmployeeRole = () => {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if (err) throw err;
        connection.query('SELECT * FROM role', (err, roles) => {
            if (err) throw err;
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'id',
                    message: 'Which employee would you like to update?',
                    choices: employees.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id })),
                },
                {
                    type: 'list',
                    name: 'role_id',
                    message: 'What is the new role of the employee?',
                    choices: roles.map(role => ({ name: role.title, value: role.id })),
                }
            ]).then((answer) => {
                connection.query('UPDATE employee SET role_id = ? WHERE id = ?', [answer.role_id, answer.id], (err) => {
                    if (err) throw err;
                    console.log('Employee role updated successfully!');
                    showPrompt();
                })
            })
        })
    })
};