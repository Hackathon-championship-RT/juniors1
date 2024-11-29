import django.contrib.auth.views as views
import django.urls

import users.views

app_name = "users"
urlpatterns = [
    django.urls.path(
        "login/",
        users.views.CustomLoginView.as_view(),
        name="login",
    ),
    django.urls.path(
        "logout/",
        views.LogoutView.as_view(
            template_name="users/logout.html",
        ),
        name="logout",
    ),
    django.urls.path(
        "signup/",
        users.views.Registration.as_view(),
        name="signup",
    ),
]

__all__ = ()
