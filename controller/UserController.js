class UserController {
    
    constructor(formIdCreate, formIdUpdate, tableId){

        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    // Função que ao apertar o botão cancelar volta pro criar usuario
    onEdit() {

        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {

            this.showPanelCreate();
        });

        this.formUpdateEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formUpdateEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formUpdateEl);

            let index = this.formUpdateEl.dataset.trIndex;

            let tr =  this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values); 

            this.getPhoto(this.formUpdateEl).then(
                (content) => {

                if (!values.photo) {
                    result._photo = userOld._photo;
                } else {
                    result._photo = content;
                }
   
                let user = new User();
                
                user.loadFromJSON(result);

                user.save();

                this.getTr(user, tr);
            
                this.updateCount();  

                this.formUpdateEl.reset();

                btn.disabled = false;

                this.showPanelCreate();

            },  (e) => {
                    console.error(e);
            }
        );
        })
    }

    // Pega o evento de submit do botão 
    onSubmit() {

        this.formEl.addEventListener("submit", event => {

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then(
                    (content) => {

                        values.photo = content;

                        values.save();

                        this.addLine(values);

                        this.formEl.reset();

                        btn.disabled = false;

                },  
                    (e) => {
                        console.error(e);
                }
            );

        });
    }

    // Função que renderiza a foto e a coloca na tela dinamicamente sem salvar no banco de dados  
    getPhoto(formEl) {

        return new Promise((resolve, reject) => {

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item => {

                if (item.name === 'photo') {
                    return item;
                }
            });

            let file = elements[0].files[0];

            fileReader.onload = () => {

                resolve(fileReader.result);

            };

            fileReader.onerror = (e) => {
                reject(e);
            }

            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                resolve('dist/img/boxed-bg.jpg')
            }
        })
    }

    // Pega os valores dos campos
    getValues(formEl) {

        let user = {};
        let isValid = true;

        [...formEl.elements].forEach(function (field, index){

            if (['name', 'email', 'password'].indexOf(field.name) > -1 && !field.value) {

                field.parentElement.classList.add('has-error');
                isValid = false;
            }

            if (field.name == "gender") {

                if(field.checked){                
                    user[field.name] = field.value;
                }
            } else if (field.name == "admin") {
            
                user[field.name] = field.checked;

            } else {

                user[field.name] = field.value;
            }
        });

        if (!isValid) {
            return false;
        }

        return new User(
            user.name, 
            user.gender, 
            user.birth, 
            user.country, 
            user.email, 
            user.password, 
            user.photo, 
            user.admin
        );

    }

    // Pega os usuarios 
    selectAll() {

        let users = User.getUsersStorage();

        users.forEach(dataUser => {

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);
        })

    }

    // Adiciona uma nova linha TR na tabela
    addLine(dataUser) {

        let tr = this.getTr(dataUser);
    
        this.tableEl.appendChild(tr);

        this.updateCount();
    }

    // Seleciona qual a TR que vai gerar 
    getTr(dataUser, tr = null) {

        if (tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        // this.getTr(user, tr);

        tr.innerHTML = `
            <td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
            <td>${dataUser.name}</td>
            <td>${dataUser.email}</td>
            <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
            <td>${Utils.dateFormat(dataUser.register)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-edit btn-xs">Editar</button>
                <button type="button" class="btn btn-danger btn-delete btn-xs">Excluir</button>
            </td>
        `;

        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr) {

        // Evento do botão excluir 
        tr.querySelector(".btn-delete").addEventListener("click", e => {

            if (confirm("Deseja realmente excluir?")) {

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.updateCount();
            }
        });

        // Evento do botão editar 
        tr.querySelector(".btn-edit").addEventListener("click", e => {

            let json = JSON.parse(tr.dataset.user);

            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json) {

                let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue;
                            break;

                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                        break;

                        case 'checkbox':
                            field.checked = json[name];
                        break;

                        default:
                            field.value = json[name];
                    }
                 
                }

            }

            this.formUpdateEl.querySelector(".photo").src = json._photo;

            this.showPanelUpdate();
        });
    }

    // Função que faz aparecer o painel de criar ususario
    showPanelCreate() {

        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";
    }

    // Função que faz aparecer o painel de editar ususario
    showPanelUpdate() {

        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";
    }

    // Faz a contagem de Users e Admin e atualiza a Dashboard
    updateCount() {

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr => {

            numberUsers ++;

            let user = JSON.parse(tr.dataset.user);

            if (user._admin) numberAdmin ++;

        });

        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;
    }

}