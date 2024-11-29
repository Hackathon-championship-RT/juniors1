import django.views

import users.forms
from django.contrib.auth.views import LoginView


class Registration(django.views.View):
    form_class = users.forms.SignUpForm
    template_name = "users/signup.html"

    def get(self, request):
        form = users.forms.SignUpForm()
        context = {
            "form": form,
        }
        return django.shortcuts.render(request, self.template_name, context)

    def post(self, request):
        form = users.forms.SignUpForm(request.POST)
        if form.is_valid():
            form.save()
            return django.shortcuts.redirect("users:login")
        context = {"form": form}
        return django.shortcuts.render(request, self.template_name, context)


class CustomLoginView(LoginView):
    template_name = "users/login.html"
    form_class = users.forms.CustomLoginForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "Войти в аккаунт"
        return context
