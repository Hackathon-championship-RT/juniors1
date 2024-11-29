import django.contrib.auth
from django import forms
from django.contrib.auth.forms import AuthenticationForm


class CustomLoginForm(AuthenticationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.visible_fields():
            field.field.widget.attrs["class"] = "form-control"

    class Meta:
        model = django.contrib.auth.models.User
        fields = ["username", "password"]

    username = forms.CharField(label="Имя пользователя")
    password = forms.CharField(label="Пароль", widget=forms.PasswordInput)


class SignUpForm(django.contrib.auth.forms.UserCreationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.visible_fields():
            field.field.widget.attrs["class"] = "form-control"

    class Meta(django.contrib.auth.forms.UserCreationForm.Meta):
        model = django.contrib.auth.models.User
        fields = [
            django.contrib.auth.models.User.email.field.name,
            django.contrib.auth.models.User.username.field.name,
            "password1",
            "password2",
        ]
        labels = [
            "Электронна",
            "password2",
        ]

    email = forms.EmailField(
        label="Электронная почта",
        required=True,
        widget=forms.EmailInput(attrs={"class": "form-control"}),
        help_text="Введите действующий адрес электронной почты",
    )
    username = forms.CharField(
        label="Имя пользователя",
        widget=forms.TextInput(attrs={"class": "form-control"}),
        help_text="Ваше имя пользователя, которое будет использоваться для входа",
    )
    password1 = forms.CharField(
        label="Пароль",
        widget=forms.PasswordInput(attrs={"class": "form-control"}),
        help_text="Минимум 8 символов, включая цифры и буквы",
    )
    password2 = forms.CharField(
        label="Подтверждение пароля",
        widget=forms.PasswordInput(attrs={"class": "form-control"}),
        help_text="Введите тот же пароль для подтверждения",
    )
