const inquirer = require("inquirer");
const consoleTable = require("console.table");
const mysql = require("mysql2");
const logo = require("asciiart-logo");

require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

//object containing the SQL Queries the app utilizes
const sqlQueries = {
  viewAllDepartmentsQuery: "SELECT * FROM `department`",
  viewAllRolesQuery:
    "SELECT role.id, role.title AS role, role.salary, department.`name` AS department FROM `role` JOIN department ON `department`.id = `role`.department_id ORDER BY role.id",
  viewAllEmployeesQuery:
    "SELECT employee.id, employee.first_name, employee.last_name, CONCAT(mgr.first_name,' ',mgr.last_name) AS manager, role.title AS role, role.salary, department.`name` AS department FROM `employee` JOIN `role` ON `role`.id = `employee`.role_id JOIN `department` ON `department`.id = `role`.department_id LEFT JOIN `employee` `mgr` ON `mgr`.id = `employee`.manager_id",
  addDepartmentQuery: "INSERT INTO `department` (`name`) VALUES (?)",
  addRoleQuery: "INSERT INTO `role` (title, salary, department_id) VALUES (?, ?, ?)",
  addEmployeeQuery: "INSERT INTO `employee` (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
  updateEmployeeRoleQuery: "UPDATE employee SET role_id = ? WHERE id = ?",
};

function init() {
  console.log(
    logo({
      name: "Employee Tracker",
    }).render()
  );
  userChoices();
}
//prompts user with choices to interact with the app
function userChoices() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "choices",
        message: "What would you like to do?",
        choices: [
          "[View All] Departments",
          "[View All] Roles",
          "[View All] Employees",
          "[Add] Role",
          "[Add] Department",
          "[Add] Employee",
          "[Update] Employee Role",
          "[Quit] Exit Program"
        ],
      },
    ])
    .then((answer) => {
      let answerValue = Object.values(answer);
      switch (answerValue[0]) {
        case "[View All] Departments":
          viewAllDepartments();
          break;

        case "[View All] Roles":
          viewAllRoles();
          break;

        case "[View All] Employees":
          viewAllEmployees();
          break;

        case "[Add] Department":
          addDepartment();
          break;

        case "[Add] Employee":
          addEmployee();
          break;

        case "[Add] Role":
          addRole();
          break;

        case "[Update] Employee Role":
          updateEmployeeRole();
          break;

        case "[Quit] Exit Program":
          process.exit();
          break;
      }
    });
}

function viewAllDepartments() {
  connection.query(sqlQueries.viewAllDepartmentsQuery, function (err, results) {
    console.log("\n");
    console.table(results);
    userChoices();
  });
}

function viewAllRoles() {
  connection.query(
    sqlQueries.viewAllRolesQuery,
    function (err, results) {
      console.log("\n");
      console.table(results);
      userChoices();
    }
  );
}

function viewAllEmployees() {
  connection.query(
    sqlQueries.viewAllEmployeesQuery,
    function (err, results) {
      console.log("\n");
      console.table(results);
      userChoices();
    }
  );
}
//function to add a department to the database
function addDepartment() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "departmentName",
        message: "Enter new department name:",
      },
    ])
    .then((answer) => {
      connection.query(
        sqlQueries.addDepartmentQuery,
        [Object.values(answer)],
        function (err, results) {
          connection.query(
            sqlQueries.viewAllDepartmentsQuery,
            function (err, results) {
              console.log("\n");
              console.table(results);
              userChoices();
            }
          );
        }
      );
    });
}

//function to add an employee to the database
function addEmployee() {
  let employeeArray = ["None"];
  let roleArray = [];
  connection.query(sqlQueries.viewAllEmployeesQuery, function (err, results) {
    results.forEach((employee) => {
      employeeArray.push(
        `${employee.first_name}` + " " + `${employee.last_name}`
      );
    });
    connection.query(sqlQueries.viewAllRolesQuery, function (err, results) {
      results.forEach((role) => {
        roleArray.push(role.role);
      });
      inquirer
        .prompt([
          {
            type: "input",
            name: "firstName",
            message: "Enter employee's first name:",
          },
          {
            type: "input",
            name: "lastName",
            message: "Enter employee's last name:",
          },
          {
            type: "list",
            name: "roleList",
            message: "Select a role:",
            choices: roleArray,
          },
          {
            type: "list",
            name: "employeeList",
            message: "Select a manager:",
            choices: employeeArray,
          },
        ])
        .then((answer) => {
          const { firstName, lastName, roleList, employeeList } = answer;
          let roleID = roleArray.indexOf(answer.roleList) + 1;
          let employeeID = employeeArray.indexOf(answer.employeeList);
          if (employeeID === 0) {
            employeeID = null;
          }
          connection.query(
            sqlQueries.addEmployeeQuery,
            [answer.firstName, answer.lastName, roleID, employeeID],
            function (err, results) {
              console.log(
                "\x1b[32m%s\x1b[0m",
                `> Success: ${answer.firstName} ${answer.lastName} has been added.`
              );
              userChoices();
            }
          );
        });
    });
  });
}
//function to add a role for employees to be bound to
function addRole() {
  connection.query(sqlQueries.viewAllDepartmentsQuery, function (err, results) {
    let departmentArray = [];
    results.forEach((department) => {
      departmentArray.push(department.name);
    });
    inquirer
      .prompt([
        {
          type: "input",
          name: "roleName",
          message: "Enter new role name:",
        },
        {
          type: "input",
          name: "salaryAmount",
          message: "Enter salary amount:",
        },
        {
          type: "list",
          name: "departmentList",
          message: "Select department:",
          choices: departmentArray,
        },
      ])
      .then((answer) => {
        const { roleName, salaryAmount, departmentList } = answer;
        let departmentID = departmentArray.indexOf(answer.departmentList) + 1;
        connection.query(
          sqlQueries.addRoleQuery,
          [answer.roleName, answer.salaryAmount, departmentID],
          function (err, results) {
            connection.query(
              sqlQueries.viewAllRolesQuery,
              function (err, results) {
                console.log("\n");
                console.table(results);
                userChoices();
              }
            );
          }
        );
      });
  });
}
// Function to update an employees role within the company
function updateEmployeeRole() {
  let employeeArray = [];
  let employeeIDArray = [];
  let roleArray = [];
  let roleIDArray = [];
  connection.query(sqlQueries.viewAllEmployeesQuery, function (err, results) {
    results.forEach((employee) => {
      employeeArray.push(
        `${employee.first_name}` + " " + `${employee.last_name}`
      );
      employeeIDArray.push(`${employee.id}`);
    });
    connection.query(sqlQueries.viewAllRolesQuery, function (err, results) {
      results.forEach((role) => {
        roleArray.push(role.role);
        roleIDArray.push(role.id);
      });
      inquirer
        .prompt([
          {
            type: "list",
            name: "employeeList",
            message: "Select an employee:",
            choices: employeeArray,
          },
          {
            type: "list",
            name: "roleList",
            message: "Select a role:",
            choices: roleArray,
          },
        ])
        .then((answer) => {
          const { employeeList, roleList } = answer;
          const selectedEmployee = employeeArray.indexOf(answer.employeeList);
          const selectedEmployeeID = parseInt(
            employeeIDArray[selectedEmployee]
          );
          const selectedRole = roleArray.indexOf(answer.roleList);
          const selectedRoleID = roleIDArray[selectedRole];
          connection.query(
            sqlQueries.updateEmployeeRoleQuery,
            [selectedRoleID, selectedEmployeeID],
            function (err, results) {
              console.log(
                "\x1b[32m%s\x1b[0m",
                `> Success: ${answer.employeeList}'s role has been updated.`
              );
              userChoices();
            }
          );
        });
    });
  });
}

init();
