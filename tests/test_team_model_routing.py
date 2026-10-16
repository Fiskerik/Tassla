"""Offline tests for Tassla SDK role model routing; no API calls are made."""
import contextlib
import io
import os
import sys
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from agents import ModelSettings

from run_team import main as run_team_main
from tassla_team.chief_of_staff import CriticReview, RoutingPlan, TeamRequest, run_question
from tassla_team.critic import build_critic_agent
from tassla_team.model_routing import ROLE_ROUTES, agent_model_config, resolve_route
from tassla_team.product import build_product_agent
from test_agent import build_head_of_product_synthesis, main as test_agent_main


EXPECTED_ROUTES = {
    "head_of_product": ("gpt-6-luna", "medium"),
    "growth_distribution": ("gpt-6-luna", "low"),
    "customer_product_critic": ("gpt-6-luna", "medium"),
    "commercial_lead": ("gpt-6-luna", "medium"),
    "partnerships": ("gpt-6-luna", "low"),
    "market_intelligence": ("gpt-6-luna", "low"),
    "commercial_analyst": ("gpt-6.1-sol", "high"),
    "ai_tech_lead": ("gpt-6-luna", "medium"),
    "codex_implementation_adviser": ("gpt-6.1-sol", "high"),
    "qa": ("gpt-6-luna", "medium"),
    "chief_router": ("gpt-6-luna", "low"),
    "chief_synthesis": ("gpt-6-luna", "low"),
}


def _usage():
    return SimpleNamespace(requests=1, input_tokens=1, output_tokens=1)


class ModelRoutingTests(unittest.TestCase):
    def test_role_map_and_settings_match_approved_routes(self):
        self.assertEqual(set(ROLE_ROUTES), set(EXPECTED_ROUTES))
        for role_id, (model, effort) in EXPECTED_ROUTES.items():
            with self.subTest(role=role_id):
                route = resolve_route(role_id)
                self.assertEqual((route.model, route.reasoning_effort), (model, effort))
                actual_model, settings = agent_model_config(role_id, max_tokens=17)
                self.assertEqual(actual_model, model)
                self.assertIsInstance(settings, ModelSettings)
                self.assertEqual(settings.reasoning.effort, effort)
                self.assertEqual(settings.max_tokens, 17)

    def test_global_test_override_disables_reasoning_and_preserves_settings(self):
        for role_id in EXPECTED_ROUTES:
            with self.subTest(role=role_id):
                route = resolve_route(role_id, "test-model")
                model, settings = agent_model_config(role_id, "test-model", max_tokens=23)
                self.assertEqual((route.model, route.reasoning_effort), ("test-model", None))
                self.assertEqual(model, "test-model")
                self.assertIsNone(settings.reasoning)
                self.assertEqual(settings.max_tokens, 23)

    def test_builders_apply_routes_and_keep_product_tool_settings(self):
        created = []

        def fake_agent(**kwargs):
            agent = SimpleNamespace(**kwargs)
            created.append(agent)
            return agent

        with (
            patch("tassla_team.product.Agent", side_effect=fake_agent),
            patch("tassla_team.growth.Agent", side_effect=fake_agent),
            patch("tassla_team.critic.Agent", side_effect=fake_agent),
        ):
            product = build_product_agent()
            critic = build_critic_agent()
            synthesis = build_head_of_product_synthesis()

        by_name = {agent.name: agent for agent in created}
        self.assertEqual(product.model, "gpt-6-luna")
        self.assertEqual(product.model_settings.reasoning.effort, "medium")
        self.assertEqual(product.model_settings.max_tokens, 260)
        self.assertFalse(product.model_settings.parallel_tool_calls)
        self.assertEqual(product.model_settings.tool_choice, "required")
        growth = by_name["Tassla Growth & Distribution"]
        self.assertEqual(growth.model, "gpt-6-luna")
        self.assertEqual(growth.model_settings.reasoning.effort, "low")
        self.assertEqual(critic.model_settings.reasoning.effort, "medium")
        self.assertEqual(synthesis.model_settings.reasoning.effort, "medium")

    def test_chief_builds_each_team_role_with_role_specific_settings(self):
        scenarios = [
            ("product", ["growth", "critic"]),
            ("commercial", ["partnerships", "commercial_analyst"]),
            ("commercial", ["market_intelligence"]),
            ("dev", ["codex", "qa"]),
        ]
        created = []

        def fake_agent(**kwargs):
            agent = SimpleNamespace(**kwargs)
            created.append(agent)
            return agent

        def fake_run_sync(agent, *_args, **_kwargs):
            if agent.name == "AI Chief of Staff: routing":
                team, roles = current[0]
                output = RoutingPlan(
                    requests=[TeamRequest(team=team, reason="test", roles=roles)],
                    direct_answer="",
                )
            elif getattr(agent, "output_type", None) is CriticReview:
                output = CriticReview(assessment="ok", verdict="PROCEED")
            else:
                output = "offline"
            return SimpleNamespace(
                final_output=output,
                context_wrapper=SimpleNamespace(usage=_usage()),
            )

        current = [None]
        with patch("tassla_team.chief_of_staff.Agent", side_effect=fake_agent), patch(
            "tassla_team.chief_of_staff.Runner.run_sync", side_effect=fake_run_sync
        ), contextlib.redirect_stdout(io.StringIO()):
            for scenario in scenarios:
                current[0] = scenario
                run_question("offline question")

        expected_by_name = {
            "AI Chief of Staff: routing": ("gpt-6-luna", "low"),
            "Head of Product: draft": ("gpt-6-luna", "medium"),
            "Growth & Distribution": ("gpt-6-luna", "low"),
            "Customer/Product Critic": ("gpt-6-luna", "medium"),
            "Head of Product": ("gpt-6-luna", "medium"),
            "Partnerships": ("gpt-6-luna", "low"),
            "Market Intelligence": ("gpt-6-luna", "low"),
            "Commercial Analyst": ("gpt-6.1-sol", "high"),
            "Commercial Lead": ("gpt-6-luna", "medium"),
            "Codex implementation adviser": ("gpt-6.1-sol", "high"),
            "QA": ("gpt-6-luna", "medium"),
            "AI Tech Lead (under Erik)": ("gpt-6-luna", "medium"),
            "AI Chief of Staff": ("gpt-6-luna", "low"),
        }
        actual_by_name = {agent.name: agent for agent in created}
        self.assertEqual(set(actual_by_name), set(expected_by_name))
        for name, expected in expected_by_name.items():
            with self.subTest(agent=name):
                agent = actual_by_name[name]
                self.assertEqual((agent.model, agent.model_settings.reasoning.effort), expected)
                self.assertEqual(agent.model_settings.max_tokens, 2000)

    def test_chief_override_reaches_every_constructed_agent(self):
        created = []

        def fake_agent(**kwargs):
            agent = SimpleNamespace(**kwargs)
            created.append(agent)
            return agent

        def fake_run_sync(agent, *_args, **_kwargs):
            if agent.name == "AI Chief of Staff: routing":
                output = RoutingPlan(
                    requests=[TeamRequest(team="product", reason="test", roles=["growth", "critic"])],
                    direct_answer="",
                )
            elif getattr(agent, "output_type", None) is CriticReview:
                output = CriticReview(assessment="ok", verdict="STOP")
            else:
                output = "offline"
            return SimpleNamespace(
                final_output=output,
                context_wrapper=SimpleNamespace(usage=_usage()),
            )

        with patch("tassla_team.chief_of_staff.Agent", side_effect=fake_agent), patch(
            "tassla_team.chief_of_staff.Runner.run_sync", side_effect=fake_run_sync
        ), contextlib.redirect_stdout(io.StringIO()):
            run_question("offline question", "test-model")

        self.assertTrue(created)
        for agent in created:
            with self.subTest(agent=agent.name):
                self.assertEqual(agent.model, "test-model")
                self.assertIsNone(agent.model_settings.reasoning)

    def test_test_agent_critic_entry_applies_global_override_offline(self):
        created = []

        def fake_agent(**kwargs):
            agent = SimpleNamespace(**kwargs)
            created.append(agent)
            return agent

        def fake_run_sync(agent, *_args, **_kwargs):
            output = "PROCEED" if getattr(agent, "output_type", None) is CriticReview else "offline"
            return SimpleNamespace(
                final_output=output,
                context_wrapper=SimpleNamespace(usage=_usage()),
            )

        output = io.StringIO()
        with (
            patch("tassla_team.product.Agent", side_effect=fake_agent),
            patch("tassla_team.growth.Agent", side_effect=fake_agent),
            patch("tassla_team.critic.Agent", side_effect=fake_agent),
            patch("test_agent.Agent", side_effect=fake_agent),
            patch("test_agent.Runner.run_sync", side_effect=fake_run_sync),
            patch.object(sys, "argv", ["test_agent.py", "offline question", "--critic"]),
            patch.dict(
                os.environ,
                {"OPENAI_API_KEY": "offline-test-key", "TASSLA_TEST_MODEL": "test-model"},
                clear=False,
            ),
            contextlib.redirect_stdout(output),
        ):
            test_agent_main()

        self.assertEqual(len(created), 4)
        self.assertEqual(
            {agent.name for agent in created},
            {
                "Tassla Growth & Distribution",
                "Tassla Head of Product",
                "Tassla Customer/Product Critic",
            },
        )
        for agent in created:
            with self.subTest(agent=agent.name):
                self.assertEqual(agent.model, "test-model")
                self.assertIsNone(agent.model_settings.reasoning)
        self.assertIn("Model override: test-model", output.getvalue())

    def test_roles_cli_shows_defaults_and_override_without_api_key(self):
        output = io.StringIO()
        with patch.object(sys, "argv", ["run_team.py", "--roles"]), patch.dict(
            os.environ,
            {"OPENAI_API_KEY": "", "TASSLA_TEST_MODEL": ""},
            clear=False,
        ), contextlib.redirect_stdout(output):
            run_team_main()
        self.assertIn("Head of Product | model=gpt-6-luna | reasoning=medium", output.getvalue())
        self.assertIn("Commercial Analyst | model=gpt-6.1-sol | reasoning=high", output.getvalue())

        override_output = io.StringIO()
        with patch.object(sys, "argv", ["run_team.py", "--roles"]), patch.dict(
            os.environ,
            {"TASSLA_TEST_MODEL": "test-model", "OPENAI_API_KEY": ""},
            clear=False,
        ), contextlib.redirect_stdout(override_output):
            run_team_main()
        self.assertIn("TASSLA_TEST_MODEL override active: test-model", override_output.getvalue())
        self.assertIn("AI Tech Lead | model=test-model | reasoning=disabled by test override", override_output.getvalue())
        self.assertNotIn("model=gpt-6.1-sol", override_output.getvalue())


if __name__ == "__main__":
    unittest.main()
