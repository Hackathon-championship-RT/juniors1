import django.contrib.auth
from django.db import models
from django.db.models import ForeignKey
import django.utils.safestring
import sorl.thumbnail


class Tile(models.Model):
    name = models.CharField(
        verbose_name="название",
        max_length=100,
    )
    description = models.TextField(
        verbose_name="описание",
    )
    image = models.ImageField(
        verbose_name="фото",
        upload_to="uploads/tiles/",
        null=True,
        blank=True,
    )

    @property
    def get_img(self):
        return sorl.thumbnail.get_thumbnail(
            self.image,
            "300x300",
            crop="center",
            quality=51,
        )

    @staticmethod
    def get_img_tmb_100(url):
        return django.utils.safestring.mark_safe(
            f"<img src='{url}' width='100' height='100'>",
        )

    @staticmethod
    def get_img_tmb_50(url):
        return django.utils.safestring.mark_safe(
            f"<img src='{url}' width='50' height='50'>",
        )

    def image_tmb(self):
        if self.image:
            url = self.get_img.url
            return self.get_img_tmb_100(url)

        return "нет изображения"

    image_tmb.short_description = "превью"
    image_tmb.allow_tags = True

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "плитка"
        verbose_name_plural = "плитки"


class Game(models.Model):
    name = models.CharField(
        verbose_name="название",
        max_length=100,
    )
    tiles = django.db.models.ManyToManyField(
        Tile,
        verbose_name="плитки",
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "игра"
        verbose_name_plural = "игры"


class GameResult(models.Model):
    user = ForeignKey(
        django.contrib.auth.get_user_model(),
        on_delete=django.db.models.CASCADE,
        verbose_name="пользователь",
        null=True,
        blank=True,
    )
    time = models.IntegerField(
        verbose_name="время",
    )
    created_at = models.DateTimeField(
        verbose_name="дата создания",
        auto_now_add=True,
    )
    count_shuffled = models.IntegerField(
        verbose_name="количество перешивание",
    )
    game = models.ForeignKey(
        Game,
        on_delete=django.db.models.CASCADE,
        verbose_name="игра",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.user.name

    class Meta:
        verbose_name = "результат"
        verbose_name_plural = "результаты"
